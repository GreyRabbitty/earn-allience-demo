import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Poll } from './poll.entity';
import { IPoll } from './interface/poll.interface';
import axios from 'axios';

@Injectable()
export class PollService {
  constructor(
    @InjectRepository(Poll)
    private readonly pollRepository: Repository<Poll>,
  ) {}

  private readonly apiKey: string =
    '3c2051c0a7msh7b1387f78cafaaep14bc53jsn576e3e786ad2';
  private readonly host: string = 'twitter135.p.rapidapi.com';

  async createPoll(newRaw: IPoll): Promise<Poll> {
    const poll = this.pollRepository.create(newRaw);
    return this.pollRepository.save(poll);
  }

  async updatePoll(id: number, newRaw: IPoll): Promise<any> {
    return this.pollRepository.update(id, newRaw);
  }

  async getAllPolls(): Promise<Poll[]> {
    return this.pollRepository.find();
  }

  async getPollById(id: string): Promise<Poll> {
    console.log('id ==> ', id);
    try {
      const findResult = await this.pollRepository.findOne({
        where: {
          gameId: id,
        },
      });

      console.log('findResult ==> ', findResult);
      return findResult;
    } catch (error) {
      console.log('error ==> ', error);
      return error;
    }
  }

  async getFollowerAccountHandler(id: string): Promise<any> {
    const options = {
      method: 'GET',
      url: 'https://twitter154.p.rapidapi.com/user/followers',
      params: {
        user_id: id,
        limit: '100',
      },
      headers: {
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': 'twitter154.p.rapidapi.com',
      },
    };

    try {
      const response = await axios.request(options);

      return response.data;
    } catch (error) {
      return error;
    }
  }

  async getFollowerCount(id: string): Promise<any> {
    const options = {
      method: 'GET',
      url: `https://${this.host}/v1.1/Users/`,
      params: { ids: id },
      headers: {
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': this.host,
      },
    };

    try {
      const response = await axios.request(options);

      return response.data[0].followers_count;
    } catch (error) {}
  }

  async getUserDate(id: string): Promise<any> {
    const options = {
      method: 'GET',
      url: `https://${this.host}/v1.1/Users/`,
      params: { ids: id },
      headers: {
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': this.host,
      },
    };

    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {}
  }

  async fetchFollowersListByGameId(id: string): Promise<any> {
    try {
      const delay = (ms: any) => new Promise((res) => setTimeout(res, ms));

      const count: number = await this.getFollowerCount(id);
      console.log(count);

      await delay(1500);

      let flag = false;
      let followerIdList = [];
      let nextCurse = '';

      while (flag == false) {
        await delay(500);

        const options =
          nextCurse == ''
            ? {
                method: 'GET',
                url: `https://${this.host}/v1.1/FollowersIds/`,
                params: {
                  id: id,
                  count: '5000',
                },
                headers: {
                  'X-RapidAPI-Key': this.apiKey,
                  'X-RapidAPI-Host': this.host,
                },
              }
            : {
                method: 'GET',
                url: `https://${this.host}/v1.1/FollowersIds/`,
                params: {
                  id: id,
                  count: '5000',
                  cursor: nextCurse,
                },
                headers: {
                  'X-RapidAPI-Key': this.apiKey,
                  'X-RapidAPI-Host': this.host,
                },
              };

        const response = await axios.request(options);

        followerIdList = followerIdList.concat(response.data.ids);
        nextCurse = response.data.next_cursor_str;

        if (nextCurse == '0') flag = true;
      }

      return {
        count,
        followerIdList,
      };
    } catch (error) {
      return null;
    }
  }

  async createOrUpdatePollById(gameId: string): Promise<any> {
    if (!gameId) {
      return 'Input the valid Id';
    }
    const newInfo = await this.fetchFollowersListByGameId(gameId.toString());
    if (!newInfo) {
      return 'Invalid game Id';
    }
    console.log('Rapid info ==> ', newInfo);

    const newRaw: IPoll = {
      gameId: gameId,
      followersCount: newInfo.count,
      followersList: newInfo.followerIdList,
      newList: [],
      removedList: [],
    };
    console.log('new Raw ==> ', newRaw);

    const existingRaw = await this.getPollById(gameId);
    console.log('existingRaw ==> ', existingRaw);
    if (!existingRaw) {
      const createdRaw = await this.createPoll(newRaw);
      console.log('createdRaw ==> ', createdRaw);
      return createdRaw;
    } else {
      const oldFollowers = existingRaw.followersList;
      const recentFollowers = newRaw.followersList;

      const upgradeRaw: IPoll = {
        gameId: gameId,
        followersCount: newInfo.count,
        followersList: newInfo.followerIdList,
        newList: recentFollowers.filter((x: any) => !oldFollowers.includes(x)),
        removedList: oldFollowers.filter(
          (x: any) => !recentFollowers.includes(x),
        ),
      };
      await this.updatePoll(existingRaw.id, upgradeRaw);
      console.log('updatedRaw ==> ', upgradeRaw);
      return upgradeRaw;
    }
  }
}
