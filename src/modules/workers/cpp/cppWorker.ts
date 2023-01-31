import { API } from './api'

let api;
let finished = true;
let compileMessages = [];
let outMessages = [];

// Options for the API
const apiOptions = {
  // Show compiler logs
  showLogs: true,
  // Function to get the final output
  hostWrite(s) {
    outMessages.push(s);
  },
  // Function to get the compiler logs
  logHostWrite(s) {
    // Replace ANSI escape codes
    s = s.replace(/\x1b\[[0-9;]*m/g, '');
    if (s.length > 2) {
      compileMessages.push(s);
    }
  }
}

onconnect = async (e) => {
  const port = e.ports[0];

  port.addEventListener('message', onmessage);

  async function onmessage(e) {
    // Check if the runtime is busy. If so, return an error message.
    if (!finished) {
      if (e.data.type != 'init')
        port.postMessage({ error: 'Runtime is initializing. Please retry in a few seconds. Some dependencies must be downloaded.' });
      return;
    }

    // Clear messages
    outMessages = [];
    compileMessages = [];

    // Set the flag to false to indicate that the runtime is busy
    finished = false;

    // Run the code
    try {
      if (e.data.type === 'init' && !api) {
        apiOptions["baseUrl"] = e.data.baseUrl;
        api = new API(apiOptions);
        // Sample run to initialize the runtime
        await api.compileLinkRun('int main() { return 0; }');
      } else {
        await api.compileLinkRun(e.data.script);
        port.postMessage({ debug: outMessages.join('\n') });
      }
    } catch (e) {
      port.postMessage({ error: compileMessages.join('\n') });
    }

    // Set the flag to true to indicate that the runtime is free
    finished = true;
  }

  port.start();
}
