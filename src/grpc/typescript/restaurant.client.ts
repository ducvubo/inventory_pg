// @generated by protobuf-ts 2.9.4 with parameter long_type_string,optimize_code_size
// @generated from protobuf file "restaurant.proto" (package "RestaurantProto", syntax proto3)
// tslint:disable
import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import type { ServiceInfo } from "@protobuf-ts/runtime-rpc";
import { RestaurantServiceGprc } from "./restaurant";
import { stackIntercept } from "@protobuf-ts/runtime-rpc";
import type { IBackendGRPC } from "./api";
import type { ReqFindOneRestaurantById } from "./restaurant";
import type { UnaryCall } from "@protobuf-ts/runtime-rpc";
import type { RpcOptions } from "@protobuf-ts/runtime-rpc";
/**
 * @generated from protobuf service RestaurantProto.RestaurantServiceGprc
 */
export interface IRestaurantServiceGprcClient {
    /**
     * @generated from protobuf rpc: findOneRestaurantById(RestaurantProto.ReqFindOneRestaurantById) returns (api.IBackendGRPC);
     */
    findOneRestaurantById(input: ReqFindOneRestaurantById, options?: RpcOptions): UnaryCall<ReqFindOneRestaurantById, IBackendGRPC>;
}
/**
 * @generated from protobuf service RestaurantProto.RestaurantServiceGprc
 */
export class RestaurantServiceGprcClient implements IRestaurantServiceGprcClient, ServiceInfo {
    typeName = RestaurantServiceGprc.typeName;
    methods = RestaurantServiceGprc.methods;
    options = RestaurantServiceGprc.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: findOneRestaurantById(RestaurantProto.ReqFindOneRestaurantById) returns (api.IBackendGRPC);
     */
    findOneRestaurantById(input: ReqFindOneRestaurantById, options?: RpcOptions): UnaryCall<ReqFindOneRestaurantById, IBackendGRPC> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<ReqFindOneRestaurantById, IBackendGRPC>("unary", this._transport, method, opt, input);
    }
}
