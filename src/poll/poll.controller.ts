import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PollService } from './poll.service';
import { IPoll } from './interface/poll.interface';

@Controller('polls')
export class PollController {
  constructor(private readonly pollService: PollService) {}

  @Post()
  createPoll(@Body() newRaw: IPoll) {
    return this.pollService.createPoll(newRaw);
  }

  @Get()
  getAllPolls() {
    return this.pollService.getAllPolls();
  }

  @Get('game/:id')
  getPollById(@Param('id') id: string) {
    return this.pollService.getPollById(id);
  }

  @Post('game/:id')
  updatePollById(@Param('id') id: string) {
    return this.pollService.createOrUpdatePollById(id);
  }
}
