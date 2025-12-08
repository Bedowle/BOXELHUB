import * as paypalCheckoutServerSDK from '@paypal/checkout-server-sdk';

async function getCredentials() {
  // First try env vars (from secrets)
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (clientId && clientSecret) {
    return { clientId, clientSecret };
  }

  // If no env vars, try Replit connector
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('PayPal credentials not found in env vars or Replit connector');
  }

  const connectorName = 'paypal';
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1' || process.env.NODE_ENV === 'production';
  const targetEnvironment = isProduction ? 'production' : 'development';

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', connectorName);
  url.searchParams.set('environment', targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X_REPLIT_TOKEN': xReplitToken
    }
  });

  const data = await response.json();
  const connectionSettings = data.items?.[0];

  if (!connectionSettings || (!connectionSettings.settings.client_id || !connectionSettings.settings.secret)) {
    throw new Error(`PayPal ${targetEnvironment} connection not found`);
  }

  return {
    clientId: connectionSettings.settings.client_id,
    clientSecret: connectionSettings.settings.secret,
  };
}

let paypalClient: any = null;

export async function getPayPalClient() {
  if (paypalClient) {
    return paypalClient;
  }

  try {
    const { clientId, clientSecret } = await getCredentials();
    const isProduction = process.env.REPLIT_DEPLOYMENT === '1' || process.env.NODE_ENV === 'production';

    paypalClient = new paypalCheckoutServerSDK.core.PayPalHttpClient(
      new paypalCheckoutServerSDK.core.SandboxEnvironment(clientId, clientSecret)
    );

    if (isProduction) {
      paypalClient = new paypalCheckoutServerSDK.core.PayPalHttpClient(
        new paypalCheckoutServerSDK.core.LiveEnvironment(clientId, clientSecret)
      );
    }

    return paypalClient;
  } catch (error) {
    console.error('Error creating PayPal client:', error);
    throw error;
  }
}

export async function getPayPalClientId() {
  const { clientId } = await getCredentials();
  return clientId;
}
