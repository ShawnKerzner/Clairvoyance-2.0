import { app } from "../app.ts";

export const renderApiKey = () => {
  app.innerHTML = `
    <h1>Connect your API key</h1>
    <p id="api-error"></p>
    <form id="api-form">
      <input type="password" id="api-key-input" placeholder="API Key" />
      <button type="submit" id="connect-api-btn">Connect</button>
    </form>
    <h3 id="api-instructions">How to get your key</h3>
    <ol>
      <li>Go to the <a href="https://platform.claude.com/" target="_blank" rel="noopener noreferrer">Claude Console</a> and sign in, or create a free account.</li>
      <li>Add some credits under <strong>Billing</strong>. A few dollars goes a long way for practice exercises.</li>
      <li>Open <strong>API Keys</strong> and click <strong>Create Key</strong>. Give it a name like "Clairvoyance".</li>
      <li><strong>Copy the key right away.</strong> The Console only shows the full key once.</li>
      <li>Paste it above and click <strong>Connect</strong>.</li>
    </ol>
    <h3>Good to know</h3>
    <ul>
      <li><strong>A Claude Pro or Max subscription doesn't include API access.</strong> The API is billed separately, through Console credits.</li>
      <li>Your key is stored only in this browser, in a secure cookie, never in our database. It stays connected for 7 days.</li>
      <li><strong>On a shared computer, always log out when you're done.</strong> Logging out removes your key from the browser.</li>
    </ul>
    <a href="#" id="logout-link">Logout</a>
  `;
};
