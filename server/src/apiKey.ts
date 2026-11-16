import type { Request, Response } from "express";

export const getOwnedApiKey = (req: Request, res: Response) => {
  const owner = req.signedCookies.apiKeyOwner;
  if (owner !== String(res.locals.userId)) {
    res.clearCookie("apiKey");
    res.clearCookie("apiKeyOwner");
    return null;
  }
  return req.cookies.apiKey;
};
