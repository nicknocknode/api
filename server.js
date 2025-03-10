const express = require('express')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const app = express()
const cors = require('cors')
const session = require('express-session')
const {createClient} = require('@supabase/supabase-js')

app.use(express.json())
app.use(cors())


const supabase = createClient('https://iqgcgobwgbtddedtcasi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxZ2Nnb2J3Z2J0ZGRlZHRjYXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NDg3MTAsImV4cCI6MjA1NjIyNDcxMH0.FpGwCh4Lj6A1THT07ZGlMb679R4_0iUmI5pR3GrqhLA')


app.use(session({
    resave:false,
    secret:'supersecret',
    saveUninitialized:false,
    cookie:{maxAge:60*60*1000}
}))

passport.use(new LocalStrategy({
    usernameField:'username', passwordField:'password'
},async (username, password, done) => {

    const {data, error} = (await supabase.from('users').select('*').eq('username', username))
    console.log(data[0])
    const user = data[0]

    if (!user) return done(null, false, {message:'User not found'})

    if (user.password !== password) return done(null, false, {message:'Incorrect password, try again'})

    return done(null, user)
}
))

passport.serializeUser((user, done) => {
    return done(null, user)
})

passport.deserializeUser((user, done) => {
return done(null, user)
})

app.get('/api/test', (req, res) => {
    try {
        console.log('tring')
        res.json('testing')
    } catch (error) {
        console.log(error)
    }
})

app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err)

        console.log(JSON.stringify(user) + JSON.stringify(info) + 56)

        if (!user) return res.status(401).json({success:false, message:info.message || 'Auth invalid'})
        req.logIn(user, (err) => {
            if(err) return next(err)
            console.log(user)
            res.json({success:true, redirectTo:'/store', user:user.username})
        })
    })(req, res, next)
})

app.post('/api/signup', async (req, res) => {
    let user = req.body
    let {data} = (await supabase.from('users').select('username').eq('username', user.username))
    let check = data[0]
    if(check) {
        console.log(check)
        console.log('throwing err')
        res.status(400).send('err user by that name already exists')
    }else{
        let dataid = (await supabase.from('users').select('id').order('id', {ascending:false})).data
        console.log(dataid)
        let newId = dataid[0] ? dataid[0].id + 1 : 1;
        user = {id: newId, ...user}
        console.log(newId)
        console.log(user.username)
        console.log(user.password)
        let newuserbase = (await supabase.from('users').insert({id:Number(newId), username:user.username, password:user.password}).select())
        console.log(newuserbase.data)
        console.log(newuserbase.error)
        res.send(newuserbase.data[0])
    }
})

app.get('/api/fetchitems', async (req, res) => {
    try {
        console.log('trying'+22)
        const test = (await supabase.from('items').select('*')).data
        console.log(JSON.stringify(test) + 123)
        res.json({items:test})
    } catch (error) {
        console.log(error)
    }

})


app.post('/api/trackuser', async (req, res) => {
    const {cart, user} = req.body
    const {count, error} = (await supabase.from('usercart').select('*'))
    const newNumb = count + 1
    const datacount = (await supabase.from('usercart').select('*').eq('username', user)).data
    console.log(datacount)
    if(!datacount){
    const addData = (await supabase.from('usercart').insert({id:newNumb, username:user, cart}).select()).data
    console.log(addData)
    res.send(addData)
    }else{
    const updData = (await supabase.from('usercart').update({cart}).eq('username', user).select()).data
    res.send(updData)
    }

})

app.get('/api/getuserscart/:user', async (req, res) => {
let {user} = req.params
console.log(user + 'testing')
let userscart = await supabase.from('usercart').select('cart').eq('username', user).data
console.log(userscart+'222')
if (!userscart) userscart = {items:{}, total:0}
console.log(userscart)
res.send({userscart})
})


app.listen(4000, () => {
    console.log('listending 4000')
})