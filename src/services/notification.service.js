import { EventEmitter } from 'node:events'

const ee = new EventEmitter()

ee.on('user:registered', (email) => console.log("Se ha registrado al usuario con email: " + email) )
ee.on('user:verified', (email) => console.log("Se ha verificado al usuario con email: " + email))
ee.on('user:invited', (email) => console.log("Se ha invitado al usuario con email: " + email))
ee.on('user:deleted', (email) => console.log("Se ha eliminado al usuario con email: " + email))

export default ee