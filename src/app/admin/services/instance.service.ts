import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Instance, NumberInstancesByFlavour, NumberInstancesByImage } from 'app/core/graphql/types';
import gql from 'graphql-tag';
import {map} from 'rxjs/operators';

interface CountInstancesByFlavoursResponse {
    countInstancesByFlavours: [NumberInstancesByFlavour];
}

interface CountInstancesByImagesResponse {
    countInstancesByImages: [NumberInstancesByImage];
}

const GetCountInstancesByFlavours = gql`
    {
    countInstancesByFlavours {
        id
        name
        total
      }
  }
`;

const GetCountInstancesByImages = gql`
    {
    countInstancesByImages {
        id
        name
        total
      }
  }
`;

@Injectable()
export class InstanceService {

    constructor(private apollo: Apollo) {
    }

    public countInstancesByFlavours(): Promise<NumberInstancesByFlavour[]> {
        return this.apollo.watchQuery<CountInstancesByFlavoursResponse>({
            query: GetCountInstancesByFlavours,
        }).result()
            .then(({data}) => {
                return data.countInstancesByFlavours;
            }).catch((error) => {
                throw new Error(error);
            });
    }

    public countInstancesByImages(): Promise<NumberInstancesByImage[]> {
        return this.apollo.watchQuery<CountInstancesByImagesResponse>({
            query: GetCountInstancesByImages,
        }).result()
            .then(({data}) => {
                return  data.countInstancesByImages;
            }).catch((error) => {
                throw new Error(error);
            });
    }

}
