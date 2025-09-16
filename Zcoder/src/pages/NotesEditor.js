import React,{useState, useRef} from 'react'
import { useEffect } from 'react'
import Client from '../Components/Client'
import NotesEditor from '../Components/NotesEditor'
import toast from 'react-hot-toast'
import ACTIONS from '../Actions'

import { initSocket } from '../socket'
import { Navigate, useLocation, useNavigate , useParams} from 'react-router-dom'


const EditorPage = () => {

    const [clients,setClients] = useState([]);
    const codeRef = useRef(null);


   
    const location = useLocation();
    const reactNavigator = useNavigate();
    const { roomId } = useParams();

    const socketRef = useRef(null);


    useEffect(() => {

        const init = async () => {
            
       
            //console.log('njj');
            
            socketRef.current = await initSocket();
    
            socketRef.current.on('connect_error',  handleErrors);
            socketRef.current.on('connect_fail', handleErrors);
    
            function handleErrors(err) {
                console.log('socket_error', err);
                toast.error('Socket Connection failed, try again later');
                reactNavigator('/');
            }
    
            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            // Listnening for joined event i.e... if any user joined with the respective room id

            socketRef.current.on(
                
                    ACTIONS.JOINED,

                 ({ clients, username, socketId}) => {
              
                        if(username !== location.state?.username){
                            toast.success(`${username} joined the room.`)
                        }

                        setClients(clients);

                         // also send the code to sync
                         
                        socketRef.current.emit(ACTIONS.SYNC_CODE, {
                         code: codeRef.current,
                          socketId,
                       });
                 }
        
            );



            // Listening for disconnected


            socketRef.current.on(ACTIONS.DISCONNECTED,( { socketId,username}) =>{
                toast.success(`${username} left the room.`)

                setClients((prev) =>{
                    return prev.filter( client => client.socketId !== socketId );   // this removes the username in the connected section 
                });
            });
       
        };

       init();

        // to clear the liseners which we used in current.on 

        return () => {

            if (socketRef.current) {
            socketRef.current && socketRef.current.disconnect();
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);
            socketRef.current = null;
            }
        };


   }, []);
    

   // function to copy roomID

    async function copyRoomId(){
        try{
            
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');

        }catch(err){
            toast.error('Couldnot copy Room ID');
            console.log(err);
        }
    }



    // function to leave room

    function leaveRoom(){
        reactNavigator('/');
    }



    if(!location.state){
       return  <Navigate to="/" />
    }
    

  return (
    <div className='mainWrap'>
        <div className='aside'>
            <div className='asideInner'>
                <div className='logo'>
                    <h1>We-Collab Space</h1>
                </div>
                <h3>Connected</h3>
                <div className='clientsList'>
                    {
                        clients.map((client) =>(
                            <Client 
                                key={client.socketId} 
                                username={client.username} 
                            />
                        ))
                    }
                </div>
            </div>
        <button className='btn copyBtn' onClick={copyRoomId}>Copy ROOM ID</button>
        <button className='btn leaveBtn' onClick={leaveRoom}>Leave Room</button>
        </div>

       
        <div className='noteseditorWrap'>
        <NotesEditor
            socketRef={socketRef}
            roomId={roomId}
            onCodeChange={(code) => {
              codeRef.current = code;
            }}
          />
        </div>

    </div>
  )
}

export default EditorPage

