const mongoose = require('mongoose')

if (process.argv.length < 3) {
  console.log('give password as argument')
  process.exit(1)
}

if (process.argv.length === 4) {
  console.log('give both name and number to add to database')
  process.exit(1)
}

if (process.argv.length > 5) {
  console.log('too many arguments')
  process.exit(1)
}

const password = process.argv[2]

const url = `mongodb+srv://fullstack:${password}@cluster0-t78mk.mongodb.net/person-app?retryWrites=true&w=majority`

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })

const personSchema = new mongoose.Schema({
  name: String,
  number: String,
})

const Person = mongoose.model('Person', personSchema)

// Get all
if (process.argv.length === 3) {
  console.log('phonebook:')
  Person.find({}).then(response => {
    response.forEach(person => {
      console.log(person.name, person.number)
    })
    mongoose.connection.close()
  })
}

// Add one
if (process.argv.length === 5) {
  const name = process.argv[3]
  const number = process.argv[4]
  const person = new Person({
    name: name,
    number: number,
  })

  person.save().then(() => {
    console.log(`added ${person.name} with number ${person.number} to phonebook`)
    mongoose.connection.close()
  })
}
