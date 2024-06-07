const express = require('express')
const morgan = require('morgan')

const app = express()

app.listen(3000)

app.use(morgan('dev'))

console.log('LISTEN ON PORT 3000')
