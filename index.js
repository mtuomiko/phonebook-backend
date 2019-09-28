require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()

app.use(express.static('build'))
app.use(bodyParser.json())
app.use(cors())

morgan.token('request-body', (req) => {
  return JSON.stringify(req.body)
})
// morgan outputs empty tokens as a dash so i did this to avoid printing the 
// extra dash for non-POST requests, otherwise could have gone with simpler code
app.use(morgan((tokens, req, res) => {
  const baseFormat = [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms',
  ].join(' ')

  if (req.method === 'POST') {
    return `${baseFormat} ${tokens['request-body'](req, res)}`
  }
  return baseFormat
}))

app.get('/info', (req, res) => {
  Person.find({}).then(persons => {
    const infoResponse = `<p>Phonebook has info for ${persons.length} people</p><p>${new Date()}</p>`
    res.send(infoResponse)
  })
})

app.get('/api/persons', (req, res) => {
  Person.find({}).then(persons => {
    res.json(persons.map(person => person.toJSON()))
  })
})

app.get('/api/persons/:id', (req, res, next) => {
  Person.findById(req.params.id)
    .then(person => {
      if (person) {
        res.json(person.toJSON())
      } else {
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (req, res) => {
  Person.findByIdAndDelete(req.params.id)
    .then(result => {
      res.status(204).end()
    })
    .catch(error => next(error))
})

const randomId = () => {
  return Math.floor(Math.random() * (2147483647 + 1))
}

app.post('/api/persons', (req, res) => {
  const body = req.body

  if (!body.name) {
    return res.status(400).json({ error: 'person name is missing' })
  }

  if (!body.number) {
    return res.status(400).json({ error: 'phone number is missing' })
  }

  const person = new Person({
    name: body.name,
    number: body.number,
  })

  person.save().then(savedPerson => {
    res.json(savedPerson.toJSON())
  })
})

app.put('/api/persons/:id', (req, res, next) => {
  const body = req.body

  // Possible to change name even if front end doesn't allow it
  const person = {
    name: body.name,
    number: body.number,
  }

  Person.findByIdAndUpdate(req.params.id, person, { new: true })
    .then(updatedPerson => {
      if (updatedPerson) {
        res.json(updatedPerson.toJSON())
      } else {
        res.status(404).end()
      }
      
    })
    .catch(error => next(error))
})

const errorHandler = (error, req, res, next) => {
  console.error(error.message)

  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return res.status(400).send({ error: 'malformatted id' })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Phonebook backend server running on port ${PORT}`)
})
