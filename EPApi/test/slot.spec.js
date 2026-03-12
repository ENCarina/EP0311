import request from 'supertest'
import app from '../app/app.js'

describe('/api/slots', () => {
    const restype= 'application/json; charset=utf-8'
    var token = null

    it('post /slots ', async () => {
      await request(app)
        .post('/api/slots')
        .set('Accept', 'application/json')
        .send({
            name: 'Something'
        })
        .expect('Content-Type', restype)
        .expect(201)

    })
    it('get /slots', async () => {
      await request(app)
        .get('/api/slots')
        .set('Accept', 'application/json')
        .expect('Content-Type', restype)
        .expect(200)
    })
    it('put /slots/:id', async () => {
      await request(app)
        .put('/api/slots/1')
        .set('Accept', 'application/json')
        .send({
            name: 'Another'
        })
        .expect('Content-Type', restype)
        .expect(200)
    })
    it('delete /slots/:id', async () => {
      await request(app)
        .delete('/api/slots/1')
        .set('Accept', 'application/json')
        .expect(200)
    })
})
