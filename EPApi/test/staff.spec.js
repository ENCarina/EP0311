import request from 'supertest'
import app from '../app/app.js'

describe('/api/staff', () => {
    const restype= 'application/json; charset=utf-8'
    var token = null

    it('post /staff ', async () => {
      await request(app)
        .post('/api/staff')
        .set('Accept', 'application/json')
        .send({
            name: 'Something'
        })
        .expect('Content-Type', restype)
        .expect(201)

    })
    it('get /staff', async () => {
      await request(app)
        .get('/api/staff')
        .set('Accept', 'application/json')
        .expect('Content-Type', restype)
        .expect(200)
    })
    it('put /staff/:id', async () => {
      await request(app)
        .put('/api/staff/1')
        .set('Accept', 'application/json')
        .send({
            name: 'Another'
        })
        .expect('Content-Type', restype)
        .expect(200)
    })
    it('delete /staff/:id', async () => {
      await request(app)
        .delete('/api/staff/1')
        .set('Accept', 'application/json')
        .expect(200)
    })
})
