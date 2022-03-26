import { Assert } from "../misc/assert";
import { ITrack } from "./track";

export class TrackQueue {
  private items: ITrack[];

  constructor() {
    this.items = [];
  }

  next(): ITrack {
    Assert.checkCondition(this.items.length !== 0, "Queue is empty.");
    const nextTrack = this.items.shift();
    Assert.notNullOrUndefined(nextTrack, "nextTrack");
    return nextTrack;
  }

  add(track: ITrack) {
    this.items.push(track);
  }

  length(): number {
    return this.items.length;
  }
}
