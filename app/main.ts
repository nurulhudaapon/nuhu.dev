import { Ziex } from "ziex";
import module from "../zig-out/bin/nuhu_dev.wasm";

export default new Ziex<Env>({ module, kv: "KV" });
