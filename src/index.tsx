import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// import { createServer } from 'cors-anywhere';

// const host: any = process.env.HOST || '0.0.0.0';
// const port = process.env.PORT || 8080;

// createServer({
//     originWhitelist: [], // Allow all origins
//     requireHeader: [],
//     removeHeaders: ['cookie', 'cookie2']
// }).listen(port, host, function () {
//     console.log('Running CORS Anywhere on ' + host + ':' + port);
// });

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
