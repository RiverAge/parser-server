export const useExternal = (name: string, moduleName: string) => () => {
    throw `${name} is not provided by parse-server anymore;`
}