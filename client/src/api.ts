export const sendUserInfo = async (
  path: string,
  credentials: {
    username: string;
    password: string;
  },
) => {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return response;
};
