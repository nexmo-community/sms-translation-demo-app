import React, { useEffect, useMemo, useRef, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import { Box, Grid, Heading, Main, Select, Text } from 'grommet';
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import "./App.css";

const phone_number = parsePhoneNumberFromString(process.env.REACT_APP_PHONE_NUMBER.toString(), process.env.REACT_APP_COUNTRY_CODE);
const CONNECTION_STATUS_CONNECTING = 0;
const CONNECTION_STATUS_OPEN = 1;
const CONNECTION_STATUS_CLOSING = 2;

const languages = [
  { label: "Arabic", value: "ar"},
  { label: "Chinese", value: "zh"},
  { label: "Dutch", value: "nl"},
  { label: "English", value: "en"},
  { label: "French", value: "fr"},
  { label: "German", value: "de"},
  { label: "Greek", value: "el"},
  { label: "Hebrew", value: "he"},
  { label: "Japanese", value: "ja"},
  { label: "Polish", value: "pl"},
  { label: "Portuguese", value: "pt"},
  { label: "Russian", value: "ru"},
  { label: "Spanish", value: "es"},
  { label: "Vietnamese", value: "vi"}
];

function Status({ status }) {
  switch (status) {
    case CONNECTION_STATUS_OPEN:
      return <>Connected<div className="led green"></div></>;
    case CONNECTION_STATUS_CONNECTING:
      return <>Connecting<div className="led yellow"></div></>;
    case CONNECTION_STATUS_CLOSING:
      return <>Closing<div className="led yellow"></div></>;
    default:
      return <>Disconnected<div className="led grey"></div></>;;
  }
}

const App = () => {
  const STATIC_OPTIONS = useMemo(() => ({
    shouldReconnect: (closeEvent) => true,
  }), []);

  const [messageHistory, setMessageHistory] = useState([]);
  const messagesEndRef = useRef(null);

  //eslint-disable-next-line
  const [sendMessage, lastMessage, readyState, getWebSocket] = useWebSocket(`ws://localhost:8000/socket`, STATIC_OPTIONS);
  const [translateValue, setTranslateValue] = React.useState('English');

  useEffect(() => {if (lastMessage !== null) setMessageHistory(prev => prev.concat(lastMessage))}, [lastMessage]);
  useEffect(() => { messagesEndRef.current.scrollIntoView({ behavior: "smooth" }) }, [messageHistory]);

  return (
    <Main fill>
      <Grid>
        <Box
          background="brand"
          fill="horizontal"
          style={{ "position": "fixed" }}
        >
          <Box
            align="center"
            direction="row"
            fill="horizontal"
            justify="between"
            pad="medium"
            wrap={false}
          >
            {phone_number && (
              <Box>
              <Heading level={3} margin="none">
                  Send SMS: {phone_number.formatInternational()}
              </Heading>
            </Box>
            )}
            <div className="led-box">
              <Box
                align="center"
                direction="row"
              >
                <Status status={readyState} />
              </Box>

            </div>
            <Select
              labelKey="label"
              onChange={({ option }) => {
                sendMessage(option.value)
                setTranslateValue(option.label)
              }}
              options={languages}
              value={translateValue}
              valueKey="value"
            />
          </Box>
        </Box>
        <Box
          margin={{ "top": "88px" }}
          overflow="auto"
          pad="large"
        >
          {messageHistory.map((message, idx) => {
            let msg = JSON.parse(message.data);
            return (
              <Box
                background="linear-gradient(164deg, rgba(135,31,255,1) 35%, rgba(255,166,140,1) 100%)"
                direction="column"
                key={idx}
                margin={{ "bottom": "40px" }}
                pad="medium"
                round="medium"
              >
                <Text>From: {msg.from}</Text>
                <Heading level={2}>{msg.translation}</Heading>
              </Box>
            )
          })}
          <div ref={messagesEndRef} />
        </Box>
      </Grid>
    </Main>
  ) 
};

export default App;