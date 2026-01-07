export interface ContextProviders {
  createProvider: <T>(value: T) => unknown;
  useContext: <T>() => T;
}