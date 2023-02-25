const keys = require('./keys');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(bodyParser.json());

// postgres
const { Pool } = require('pg')

const pgClient = new Pool({
    host: keys.pgHost,
    port: keys.pgPort,
    user: keys.pgUser,
    password: keys.pgPassword,
    database: keys.pgDatabase,
    max: 20,
    idleTimeoutMillis: 30000, // 30 seconds
    connectionTimeoutMillis: 2000, // 2 seconds
});
pgClient.on("error", (err) => console.log('lost postgres connection: ' + err));
pgClient.on("connect", (client) => {
    client
        .query("CREATE TABLE IF NOT EXISTS values (number INT)")
        .catch((err) => console.error(err));
});

// redis
const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000  // 1 second
});
const redisPublisher = redisClient.duplicate();

app.get('/', (req, res) => {
    res.send('Hi');
});

app.get('/values/all', async (req, res) => {
    const values = await pgClient.query('SELECT * from values');
    res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
    // promises not supported by redis client
   redisClient.hgetall('values', (err, values) => {
       res.send(values);
   });
});

app.post('/values', async (req, res) => {
    const index = req.body.index;

    if(parseInt(index) > 40) {
        return res.status(422).send('Index too high');
    }

    redisClient.hset('values', index, 'Nothing yet!');
    redisPublisher.publish('insert', index);
    pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

    res.send({ working: true});
})
  
app.listen(5000, err => {
    console.log('Listening');
})