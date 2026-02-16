import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobsModule } from './jobs/jobs.module';
import { ResourcesModule } from './resources/resources.module';

@Module({
  imports: [
    // Connexion MongoDB Atlas
    MongooseModule.forRoot(
  'mongodb+srv://mourad:mourad@smartsite.poyscqk.mongodb.net/smartsite?retryWrites=true&w=majority'
    ),
    JobsModule,
    ResourcesModule, 
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
