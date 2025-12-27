import { IsUUID } from 'class-validator';

export class AddToWishlistDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  courseId: string;
}
