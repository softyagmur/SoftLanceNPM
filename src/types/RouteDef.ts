export default interface RouteDef {
  name: string;
  route: string;
  method: "get" | "post" | "put" | "delete" | "patch";
}
