import { config as conf } from "dotenv";
conf();

class Config {
  public readonly LEMONFOX_API_KEY: string;
  public readonly OPENAI_API_KEY: string;
  public readonly LEMONFOX_API_URL: string;
  public readonly PORT: number | string;

  constructor() {
    this.LEMONFOX_API_KEY = process.env.LEMONFOX_API_KEY || "";
    this.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
    this.LEMONFOX_API_URL = "https://api.lemonfox.ai/v1/audio/transcriptions";
    this.PORT = process.env.PORT || 3000;
  }
}

const config = new Config();
export default config;
