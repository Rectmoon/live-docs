import { useState, useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { io } from 'socket.io-client'

const SAVE_INTERVAL_MS = 3000
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['bold', 'italic', 'underline'],
  [{ color: [] }, { background: [] }],
  [{ script: 'sub' }, { script: 'super' }],
  [{ align: [] }],
  ['image', 'blockquote', 'code-block'],
  ['clean']
]

export default function Document () {
  const { id: documentId } = useParams()
  const [socket, setSocket] = useState()
  const [quill, setQuill] = useState()

  useEffect(() => {
    let s = io(process.env.REACT_APP_SOCKET_PATH)
    setSocket(s)

    return () => {
      s.disconnect()
      s = null
    }
  }, [])

  useEffect(() => {
    if (!socket || !quill) return

    socket.once('load-document', content => {
      quill.setContents(content)
      quill.enable()
      quill.focus()
    })

    socket.emit('get-document', documentId)
  }, [documentId, quill, socket])

  useEffect(() => {
    const interval = setInterval(() => {
      socket.emit('save-changes', quill.getContents())
    }, SAVE_INTERVAL_MS)

    return () => {
      clearInterval(interval)
    }
  }, [quill, socket])

  useEffect(() => {
    if (!socket || !quill) return

    const handleSocketReceiveChanges = delta => {
      quill.updateContents(delta)
    }

    socket.on('receive-changes', handleSocketReceiveChanges)

    return () => {
      socket.off('receive-changes', handleSocketReceiveChanges)
    }
  }, [documentId, quill, socket])

  useEffect(() => {
    if (!socket || !quill) return

    const handleQuillTextChange = (delta, oldDelta, source) => {
      if (source === 'user') {
        socket.emit('send-changes', delta)
      }
    }

    quill.on('text-change', handleQuillTextChange)

    return () => {
      quill.off('text-change', handleQuillTextChange)
    }
  }, [documentId, quill, socket])

  const wrapperRef = useCallback(wrapper => {
    if (wrapper === null) return
    wrapper.innerHTML = ''

    const editor = document.createElement('div')
    wrapper.appendChild(editor)

    const quillInstance = new Quill(editor, {
      theme: 'snow',
      modules: { toolbar: TOOLBAR_OPTIONS }
    })

    quillInstance.disable()
    quillInstance.setText('Loading...')
    setQuill(quillInstance)
  }, [])

  return <div className='container' ref={wrapperRef} />
}
