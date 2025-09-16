import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import axios from 'axios';

const Editor = () => {
  const quillRef = useRef(null);
  const [quill, setQuill] = useState(null);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const editor = new Quill(quillRef.current, {
      theme: 'snow',
    });
    setQuill(editor);

    const webSocket = new WebSocket('ws://localhost:5001');
    webSocket.onopen = () => {
      console.log('WebSocket connection opened');
      webSocket.send(JSON.stringify({ type: 'init' }));
    };
    webSocket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.type === 'init' || data.type === 'update') {
        editor.root.innerHTML = data.content;
      }
    };
    setWs(webSocket);

    editor.on('text-change', () => {
      const content = editor.root.innerHTML;
      if (webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(JSON.stringify({ type: 'update', content }));
      }
    });

    return () => webSocket.close();
  }, []);

  

  return (
    <div>
      <div ref={quillRef} style={{ height: '650px' }}></div>
     
    </div>
  );
};

export default Editor;
