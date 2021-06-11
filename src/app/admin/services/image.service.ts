import {Injectable} from '@angular/core';
import {Apollo} from 'apollo-angular';
import {CloudImage, Image, ImageConnection, ImageProtocol} from 'app/core/graphql/types';
import gql from 'graphql-tag';

interface ImageQueryResponse {
    images: ImageConnection;
}

interface AllQueryResponse {
    images: ImageConnection;
    imageProtocols: ImageProtocol[];
    cloudImages: CloudImage[];
}

interface CreateResponse {
    createImage: Image;
}

interface UpdateResponse {
    updateImage: Image;
}

interface DeleteResponse {
    deleteImage: Image;
}

const GetAll = gql`
    query All($pagination: Pagination!){
        images(pagination:$pagination) {
             pageInfo {
                currentPage
                totalPages
                count
                offset
                limit
                hasNextPage
                hasPrevPage
            }
            data{
                id
                name
                version
                description
                visible
                deleted
                icon
                computeId
                protocols{
                    id
                    name
                }
                bootCommand
                autologin
            }
        }
        imageProtocols {
            id
            name
        }
        cloudImages {
            id
            name
        }
    }
`;

const GetImages = gql`
    query AllImages($pagination: Pagination!){
        images(pagination:$pagination) {
             pageInfo {
                currentPage
                totalPages
                count
                offset
                limit
                hasNextPage
                hasPrevPage
            }
            data{
                id
                name
                version
                description
                visible
                deleted
                icon
                computeId
                protocols{
                    id
                    name
                }
            }
        }
    }
`;

const GetCloudImages = gql`
    {
        cloudImages {
            id
            name
        }
    }
`;

const GetProtocols = gql`
    {
        imageProtocols {
            id
            name
        }
    }
`;

const UpdateImage = gql`
    mutation UpdateImage($id: Int!,$input: UpdateImageInput!){
        updateImage(id:$id,input:$input) {
            id
        }
    }
`;

const CreateImage = gql`
    mutation CreateImage($input: CreateImageInput!){
        createImage(input:$input) {
          id
          name
          version
          description
          icon
          computeId
        }
    }
`;

const DeleteImage = gql`
    mutation DeleteImage($id: Int!){
        deleteImage(id:$id) {
            id
        }
    }
`;

@Injectable()
export class ImageService {

    constructor(private apollo: Apollo) {
    }

    public deleteImage(id): Promise<Image> {
        return this.apollo.mutate<DeleteResponse>({
            mutation: DeleteImage,
            variables: {id},
        }).toPromise()
            .then(({data}) => {
                return data.deleteImage;
            }).catch((error) => {
                throw new Error(error);
            });
    }

    public createImage(imageInput): Promise<Image> {
        return this.apollo.mutate<CreateResponse>({
            mutation: CreateImage,
            variables: {input: imageInput},
        }).toPromise()
            .then(({data}) => {
                return data.createImage;
            }).catch((error) => {
                throw new Error(error);
            });
    }

    public updateImage(id: number, input: Image): Promise<Image> {
        return this.apollo.mutate<UpdateResponse>({
            mutation: UpdateImage,
            variables: {id, input},
        }).toPromise()
            .then(({data}) => {
                return data.updateImage;
            }).catch((error) => {
                throw new Error(error);
            });

    }

    public getImages(pagination: any): Promise<ImageConnection> {
        return this.apollo.watchQuery<ImageQueryResponse>({
            query: GetImages,
            variables: {pagination},
        }).result()
            .then(({data}) => {
                return data.images;
            }).catch((error) => {
                throw new Error(error);
            });
    }

    public getAll(pagination: any): Promise<{ imageConnection: ImageConnection; protocols: ImageProtocol[]; cloudImages: CloudImage[]; }> {
        return this.apollo.watchQuery<AllQueryResponse>({
            query: GetAll,
            variables: {pagination},
        }).result()
            .then(({data}) => {
                const imageConnection: ImageConnection = data.images;
                const protocols: ImageProtocol[] = data.imageProtocols;
                const cloudImages: CloudImage[] = data.cloudImages;
                return {imageConnection, protocols, cloudImages};
            }).catch((error) => {
                throw new Error(error);
            });
    }

    public getProtocols(): Promise<ImageProtocol[]> {
        return this.apollo.watchQuery<any>({
            query: GetProtocols,
        }).result()
            .then(({data}) => {
                return  data.imageProtocols;
            }).catch((error) => {
                throw new Error(error);
            });
    }

    public getCloudImages(): Promise<CloudImage[]> {
        return this.apollo.watchQuery<any>({
            query: GetCloudImages,
        }).result()
            .then(({data}) => {
                return data.cloudImages;
            }).catch((error) => {
                throw new Error(error);
            });
    }

}
