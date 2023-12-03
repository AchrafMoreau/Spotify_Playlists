
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from 'axios'
import querystring from 'querystring';

dotenv.config();
const app = express();

app.use(cors())


const Auth = async(code)=>{
  const auth_token = Buffer.from(`${process.env.ClientID}:${process.env.ClientSecret}`, 'utf-8').toString('base64');
  const scope = 'user-read-private user-read-email playlist-modify-public playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public'; 
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
  try{
    const { data}  =  await axios.post('https://accounts.spotify.com/api/token', dataauth, config)
    return data.access_token

  }catch(err){
    console.log("Auth Function : ", err?.response?.data?.error)
  }
}

app.get('/test', (req, res)=>{
  const redirectUri = "http://localhost:8000/"
  const scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public'; 
  
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      scope: scope,
      client_id: process.env.ClientID,
      redirect_uri: redirectUri,
  }));
})

// list of all the artists that will be included in the playlist 
const rappers = ['L\'morphine', 'Raid', 'Lquinze', 'Diib', 'Fat Mizzo', 'Dada', 'Mobydick', 'Nessyou', 'Mehdi Black Wind', 'Quatrehuit', "Dollypran", 'Nab fake', 'Uncle Vato', 'Art-smoke', 'Nas', 'Mf-doom', 'Kendrick lamar', 'Mobb deep', 'Rakim','Dmx', "Jay Rock", "Snoop Dog", 'Eminem', 'Dr.dre', 'Mos Def', 'The Notorious B.I.G', "2pac", "Jay-z"];


const Search_for_the_Artist = async(token, name)=>{
  const headers = { 
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
  try{
    const {data} = await axios({
      method:"GET",
      url:"https://api.spotify.com/v1/search", 
      params:{
        q:name, 
        type:'artist'
      }, 
      headers
    })
    return data.artists.items[0].id;
  }catch(err){
    return err?.response?.data
  }

}

async function ArtistTracks(token){
  let ArtistTrack= [];
  try{
    
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
    for(let i=0; i<rappers.length; i++){
      const id = await  Search_for_the_Artist(token, rappers[i])
      const { data } = await axios({
        url:`https://api.spotify.com/v1/artists/${id}/top-tracks`,
        params:{
          country: "MA"
        },
        headers,
      })
      if(data){
        for(let i=0; i<3; i++){
          console.log(data.tracks[i])
          ArtistTrack.push(data.tracks[i].uri)
          //ArtistTrack = [...ArtistTrack, ...(data[i].tracks.uri)]
        }
      }
    }
    return ArtistTrack;
  }catch(err){
    return err
  }
  

}
var tarcks = [];
app.get('/', (req, res)=>{
  const CODE = req.query?.code
  Auth(CODE).then((token)=>{
    const headers = { 
      'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    }
    axios.get("https://api.spotify.com/v1/me/playlists", {
      headers,
    })
      .then(({data})=> {
        const My_playlist= data.items.filter((elm)=> elm.name === "Rap !== Rai")
        console.log("thi;s the id ----", My_playlist[0].id)
        ArtistTracks(token).then((result)=>{
          console.log(result)
          axios({
            method: "POST",
            url:`https://api.spotify.com/v1/playlists/${My_playlist[0].id}/tracks`,
            data:{
              "uris": result
            },
            headers
          })
            .then((data)=> console.log("all good", data))
            .catch((err)=> console.log(err?.response?.data))
        })

        /*
        axios({
         method: 'POST',
         url: `https://api.spotify.com/v1/users/${data.id}/playlists`, 
         data: {
             name: "Rap !== Rai",
             description: "This PlayList is All About Rap <Hip_Hop_ForEver />",
             public: true       
          },
         headers: { 
             'Accept': 'application/json',
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${token}`,
         }
        }).then(({data})=> console.log("this's fullfiled", data))
          .catch((err) => console.log("creating playlists : ",err?.response?.data))
    */
      }) 
      .catch((err)=> console.log("userInfo: ",err?.response?.data?.error))
  }) 
})

app.get("/:id", (req, res)=>{
  const { id } = req.params
  console.log(token)
  axios({
      method: 'POST',
      url: `https://api.spotify.com/v1/users/${id}/playlists`, 
      data: {
          name: "Rap !== Rai",
          description: "This PlayList is All About Rap <Hip_Hop_ForEver />",
          public: true       
       },
      headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
      }
    }).then(({data})=> console.log("this's fullfiled", data))
    .catch((err) => console.log("creating playlists : ",err?.response?.data))

    res.send(id)
})


app.listen(8000, ()=> console.log("we are listing to the port 8000"))
