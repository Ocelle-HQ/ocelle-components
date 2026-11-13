// fail-network: an image from another origin.
export default { title: "Network" };

export const RemoteImage = { render: (): string => `<p>An image from elsewhere: <img src="https://example.com/plant.png" alt="" width="16" height="16"></p>` };
