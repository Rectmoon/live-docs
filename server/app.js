require('dotenv').config()

const mongoose = require('mongoose')
const Document = require('./Document')

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
  })
  .then(() => console.log('mongo connected'))
  .catch(e => console.error(e))

const defaultValue = ''

const io = require('socket.io')(process.env.PORT, {
  cors: {
    origin: process.env.REACT_APP_BASE_URL,
    methods: ['GET', 'POST']
  }
})

io.on('connection', socket => {
  socket.on('get-document', async documentId => {
    const { data } = await findOrCreateDocument(documentId)
    socket.join(documentId)
    socket.emit('load-document', data)

    socket.on('send-changes', async delta => {
      socket.broadcast.to(documentId).emit('receive-changes', delta)
    })

    socket.on('save-changes', async data => {
      await Document.findByIdAndUpdate(documentId, { data })
    })
  })
})

async function findOrCreateDocument (id) {
  if (!id) return

  return (
    (await Document.findById(id)) ||
    (await Document.create({ _id: id, data: defaultValue }))
  )
}
