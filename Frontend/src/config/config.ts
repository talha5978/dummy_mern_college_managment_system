class Config {
    readonly backendUrl = import.meta.env.VITE_BACKEND_ORIGIN;
}

const config: any = new Config()
export default config