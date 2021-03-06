const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const morgan = require('morgan')
const Person = require('./models/person')

app.use(express.static('build'))
app.use(cors())
app.use(express.json())

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

morgan.token('body', (req) => {
  return JSON.stringify(req.body)
})

app.use(
  morgan((tokens, req, res) => {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, 'content-length'),
      '-',
      tokens['response-time'](req, res),
      'ms',
      tokens.body(req, res),
    ].join(' ')
  })
)

/*const generateId = () => {
  const min = Math.ceil(5);
  const max = Math.floor(1000);
  return Math.floor(Math.random() * (max - min + 1) + min);
}; */

app.get('/', (request, response) => {
  response.send('<h1>Puhelinluettelo</h1>')
})

app.get('/info', (request, response) => {
  const date = new Date()
  Person.find({}).then((persons) => {
    response.send(`<div>
    <p>Phonebook has info for ${persons.length} people</p>
    <p>${date}</p>
    </div>`)
  })
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then((persons) => {
    response.json(persons.map((person) => person.toJSON()))
  })
})

app.post('/api/persons', (request, response, next) => {
  const body = request.body

  /*
  if (persons.filter((person) => person.name === body.name).length > 0) {
    return response.status(400).json({
      error: "name must be unique",
    });
  } */

  const person = new Person({
    name: body.name,
    number: body.number,
    //id: generateId(),
  })

  person
    .save()
    .then((savedPerson) => savedPerson.toJSON())
    .then((savedAndFormattedPerson) => {
      response.json(savedAndFormattedPerson)
    })
    .catch((error) => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch((error) => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch((error) => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body

  const person = {
    name: body.name,
    number: body.number,
  }

  Person.findByIdAndUpdate(request.params.id, person, { new: true, runValidators: true })
    .then((updatedPerson) => {
      response.json(updatedPerson.toJSON())
    })

    .catch((error) => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
