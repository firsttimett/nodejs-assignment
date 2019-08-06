# Nodejs API application for an interview

Teachers need a system where they can perform administrative functions for their students. Teachers and students are identified by their email addresses. Develop a set of API endpoints, for teachers to perform administrative functions for their classes.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. The database is hosted at https://remotemysql.com.

### Prerequisites

1. node (https://nodejs.org/en/)
2. npm (https://www.npmjs.com/get-npm)

## Setting up the environment dependencies
```
$ npm install
```
### Connecting to database host locally (optional)

1. Select a database and execute the .sql file resides at this location (https://github.com/firsttimett/nodejs-assignment/blob/master/sql/nodejs_api_db_20190728.sql)
2. Change the db connection details at .env file at this location (https://github.com/firsttimett/nodejs-assignment/blob/master/.env)

## Running the server locally
```
$ npm run start
```
## Running the tests
```
$ npm run test
```
### Postman collection

https://www.getpostman.com/collections/3a0d631a3c8eaa65961e

## Built With

* [express](https://expressjs.com/) - The web framework used
* [dotenv](https://www.npmjs.com/package/dotenv) - Module that loads environment variables
* [mysql](https://www.npmjs.com/package/mysql) - node.js driver for MySQL
* [knex](http://knexjs.org/) - SQL query builder
* [chai] & [chai-http](https://www.chaijs.com/)  - BDD / TDD assertion library for node
* [mocha](https://mochajs.org/) - Js test framework running on node
