import { Injectable } from '@nestjs/common';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Characters } from './entities/character.entity';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { Vote } from './entities/vote.entity';


@Injectable()
export class CharactersService {
  constructor(
    @InjectRepository(Characters)
    private readonly charactersRepository: Repository<Characters>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(Vote)
    private votesRepository: Repository<Vote>,
  ) {}

  async getCharactersUnderComic(comicId: string): Promise<Characters[]> {
    const apiUrl = this.configService.get<string>('MARVEL_API_URL');
    const apiKey = this.configService.get<string>('MARVEL_API_KEY');
    const ts = this.configService.get<string>('MARVEL_API_TS');
    const hash = this.configService.get<string>('MARVEL_API_HASH');

    const url = `${apiUrl}/comics/${comicId}/characters?ts=${ts}&apikey=${apiKey}&hash=${hash}`;

    const response = await firstValueFrom(this.httpService.get(url));

    const charactersData = response.data.data.results;

    const charactersEntities = charactersData.map((character: any) => {
      const characterEntity = new Characters();
      characterEntity.name = character.name;
      characterEntity.description = character.description;
      characterEntity.thumbnailUrl = `${character.thumbnail.path}.${character.thumbnail.extension}`;
      return characterEntity;
    });

    return this.charactersRepository.save(charactersEntities);
  }

  async getAllCharacters(): Promise<Characters[]> {
    return this.charactersRepository.find();
  }

  create(createCharacterDto: CreateCharacterDto) {
    const newCharacter = this.charactersRepository.create(createCharacterDto);
    return this.charactersRepository.save(newCharacter);
  }

  findAll() {
    return this.charactersRepository.find();
  }

  findOne(id: number) {
    return this.charactersRepository.findOne({ where: { id } });
  }

  update(id: number, updateCharacterDto: UpdateCharacterDto) {
    return this.charactersRepository.update(id, updateCharacterDto);
  }

  remove(id: number) {
    return this.charactersRepository.delete(id);
  }

  // Método para permitir que um personagem vote em outro
  async vote(voterId: number, votedId: number): Promise<string> {
    const voter = await this.charactersRepository.findOne({ where: { id: voterId } });
    const voted = await this.charactersRepository.findOne({ where: { id: votedId } });

    // Verifica se o personagem pode votar (precisa de estrelas)
    if (voter.stars <= 0) {
      return 'Você não tem estrelas disponíveis para votar.';
    }

    // Atualiza as estrelas do personagem votante (1 estrela é usada para o voto)
    voter.stars -= 1;
    await this.charactersRepository.save(voter);

    // Cria o voto
    const vote = new Vote();
    vote.voter = voter;
    vote.voted = voted;
    vote.value = 1; // 1 estrela para o voto

    await this.votesRepository.save(vote);

    return 'Voto realizado com sucesso.';
  }

  // Método para reiniciar o saldo de estrelas dos personagens a cada 3 dias
  async resetStars(): Promise<void> {
    const characters = await this.charactersRepository.find();

    const now = new Date();
    for (const character of characters) {
      // Verifica se se passaram 3 dias desde a última votação
      if ((now.getTime() - new Date(character.lastVoteDate).getTime()) >= 259200000) {
        character.stars = 3; // Resetando o saldo de estrelas para 3
        character.lastVoteDate = now;
        await this.charactersRepository.save(character);
      }
    }
  }

  // Rota para buscar o personagem com mais estrelas
  async getCharacterHighlight(): Promise<Character> {
    const characters = await this.charactersRepository.find();
    return characters.reduce((prev, current) => (prev.stars > current.stars ? prev : current));
  }  
}
