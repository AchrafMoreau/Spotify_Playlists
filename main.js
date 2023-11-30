
import SpotifyWebApi from "spotify-web-api-node";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from 'axios'
import qs from "qs";
import querystring from 'querystring';

dotenv.config();
const app = express();
const spotifyApi = new SpotifyWebApi({
  clientId: "3ce08d2df21c433f81932fd87920ab65",
  clientSecret: "3995eefcfa99461bb6db7d0f4f9dce65",
  redirectUri: "http://localhost:8888/callback"
})


app.use(cors())


const Auth = async(code)=>{
  console.log('this\'s from auth function',code)
  const auth_token = Buffer.from(`${process.env.ClientID}:${process.env.ClientSecret}`, 'utf-8').toString('base64');
  const dataForAxios = qs.stringify({'grant_type':'client_credentials'});
  const dataauth = {
    code: code,
    redirect_uri: process.env.REDIRECT_URL,
    grant_type: 'authorization_code'
  }
  const config = {
    headers: { 
      'Authorization': `Basic ${auth_token}`,
      'Content-Type': 'application/x-www-form-urlencoded' 
    }
  };
  console.log("-------------------------------------------------------------------")
  try{
    const { data}  =  await axios.post('https://accounts.spotify.com/api/token', dataauth, config)
    return data.access_token

  }catch(err){
    console.log(err.response.data.error)
  }
}

app.get('/login', (req, res)=>{
  const redirectUri = "http://localhost:8000/"
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.ClientID,
      redirect_uri: redirectUri,
    }));


})
app.get('/', async(req, res)=>{
  /*
  spotifyApi.searchArtists("morphine")
    .then(({ body })=> console.log(body.artists.items))
    .catch((err)=> console.log(err))
  */
  //spotifyApi.createPlaylist("Rap !== Rai", {description: "This PlayList is All About Rap <Hip_Hop_ForEver />", public: true})
  const CODE = req.query?.code
  console.log("this's form the callback function", CODE)
  Auth(CODE).then((token)=>{
  console.log("this;s the token",token)
  const config = {
    headers:{
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      "Accept": "application/json"
    }
  }

  axios({
      method: 'GET',
      url: `https://api.spotify.com/v1/me`,
      // data: {
      //     "name": "Hip_Hop forever",
      //     "description": "Playlist generated using singlespotify by Kabir Virji",
      //     "public": true
      // },
      headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
      }
  }).then(({data})=> console.log(data))
    .catch((err) => console.log(err?.response?.data?.error))

    // axios.get("https://api.spotify.com/v1/me", config)
    //   .then(({data})=> console.log('thiss ffrom then ',data))
    //   .catch((err)=> console.log("this's from getUser profile", err?.response?.data?.error))
    // const data = {
    //   name: "Rap !== Rai",
    //   description: "This PlayList is All About Rap <Hip_Hop_ForEver />",
    //   public: true
    // }
    // axios.post(`https://api.spotify.com/v1/users/playlists`, data, config)
    //     .then(({data})=>{
    //       console.log(data)
    //     }) 
    //     .catch((err)=>{
    //       console.log(err?.response?.data?.error)
    //     })
    }) 
    
  })


app.listen(8000, ()=> console.log("we are listing to the port 8000"))
