const fetch = require('node-fetch')
const {ApolloClient} = require("apollo-client")
const { InMemoryCache } = require('apollo-cache-inmemory')
const debug = require("debug")("graphql-client")
const gql = require("graphql-tag")
const { createHttpLink } = require('apollo-link-http')
const { onError } = require('apollo-link-error')
const { IntrospectionFragmentMatcher } = require('apollo-cache-inmemory')

const program = require("commander")

const errorLink = onError(({ networkError }) => {
  if (networkError.statusCode === 401) {
    debug('networkError :', networkError)
  }
})
const get_schema = (uri, token) => {
  return fetch(`${uri}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      variables: {},
      query: `
      {
        __schema {
          types {
            kind
            name
            possibleTypes {
              name
            }
          }
        }
      }
    `,
    }),
  })
  .then(result => result.json())
  .then(result => {
    const filteredData = result.data.__schema.types.filter(
      type => type.possibleTypes !== null,
    );
    result.data.__schema.types = filteredData;
    return result.data
  });
}

const run = (uri, token, query_string, variables) => {
  return get_schema(uri, token).then(data => {
    const fragmentMatcher = new IntrospectionFragmentMatcher({
      introspectionQueryResultData: data
    });
    const cache = new InMemoryCache({fragmentMatcher})
    const headers = {Authorization: `Bearer ${token}`}
    const link = errorLink.concat(createHttpLink({uri, fetch, headers}))
    const client = new ApolloClient({link, cache})
    return client
      .query({
        query: gql`${query_string}`,
        variables: JSON.parse(variables)
      })
      .then(JSON.stringify)
      .catch(debug)
  }).catch(debug)

 }

const mutate = (uri, token, query_string, variables) => {
  const cache = new InMemoryCache()
  const headers = {Authorization: `Bearer ${token}`}
  const link = errorLink.concat(createHttpLink({uri, fetch, headers}))
  const client = new ApolloClient({link, cache})
  return client
    .mutate({
      mutation: gql`${query_string}`,
      variables: JSON.parse(variables)
    })
    .then(JSON.stringify)
    .catch(debug)
}

program
  .version('0.1.0')

program
  .command('query <host> <token> <query> [data]')
  .alias('q')
  .action((host, token, query, data) => {
    debug(`Host: ${host}`)
    debug(`Token: ${token}`)
    debug(`Query: ${query}`)
    debug(`Data: ${data}`)
    data = data || "{}"
    run(host, token, query, data)
      .then(console.log)
      .catch(debug)
  })

program
  .command('mutate <host> <token> <query> <data>')
  .alias('m')
  .action((host, token, query, data) => {
    debug(`Host: ${host}`)
    debug(`Token: ${token}`)
    debug(`Query: ${query}`)
    debug(`Data: ${data}`)
    mutate(host, token, query, data)
      .then(console.log)
      .catch(debug)
  })


program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
