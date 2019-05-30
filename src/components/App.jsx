import * as React from 'react'
import HostMeeting from './HostMeeting'

export default class App extends React.PureComponent {
  componentDidMount() {
    const script = document.createElement('script')

    script.src = '../lib/janus.js'
    script.async = true

    document.body.appendChild(script)
  }

  render() {
    return (
      <div>
        <h1>Conference meeting!</h1>
        <HostMeeting />
      </div >
    )
  }
}
