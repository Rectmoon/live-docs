import React from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from 'react-router-dom'
import { v4 as uuidV4 } from 'uuid'
import Document from './Document'

export default function App () {
  return (
    <Router basename='/hera'>
      <Switch>
        <Route path='/' exact>
          <Redirect to={`/document/${uuidV4()}`} />
        </Route>

        <Route path='/document/:id'>
          <Document />
        </Route>
      </Switch>
    </Router>
  )
}
