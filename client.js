const fetch = require('node-fetch')
const {ApolloClient} = require("apollo-client")
const { InMemoryCache } = require('apollo-cache-inmemory')
const debug = require("debug")("graphql-client")
const gql = require("graphql-tag")
const { createHttpLink } = require('apollo-link-http')
const program = require("commander")


const run = (uri, token, query) => {
  const cache = new InMemoryCache()
  const headers = {Authorization: `Bearer ${token}`}
  const link = createHttpLink({uri, fetch, headers})
  const client = new ApolloClient({link, cache})
  return client.query({query: query})
    .then(JSON.stringify)
    .catch(debug)
}

program
  .version('0.1.0')
  .arguments('<host> <token> <query>')
  .action((host, token, query) => {
    debug(`Host: ${host}`)
    debug(`Token: ${token}`)
    debug(`Query: ${query}`)
    run(host, token, gql`${query}`)
      .then(console.log)
      .catch(debug)
  })
  .parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
