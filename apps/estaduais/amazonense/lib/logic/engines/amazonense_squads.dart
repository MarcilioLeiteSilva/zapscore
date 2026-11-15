import '../models/squad_player.dart';

class AmazonenseSquads {
  static List<SquadPlayer> getSquad(int teamExternalId) {
    final players = _squads[teamExternalId];
    if (players != null && players.isNotEmpty) {
      return players;
    }
    return [];
  }

  static final Map<int, List<SquadPlayer>> _squads = {
    // 7578 - Nacional Futebol Clube
    7578: [
      SquadPlayer(id: 757801, name: 'Robson', number: 1, position: 'Goalkeeper', age: 31),
      SquadPlayer(id: 757802, name: 'Tom', number: 12, position: 'Goalkeeper', age: 25),
      SquadPlayer(id: 757803, name: 'Ivan', number: 3, position: 'Defender', age: 29),
      SquadPlayer(id: 757804, name: 'Davy', number: 4, position: 'Defender', age: 27),
      SquadPlayer(id: 757805, name: 'Rogério', number: 2, position: 'Defender', age: 28),
      SquadPlayer(id: 757806, name: 'Calebe', number: 8, position: 'Midfielder', age: 26),
      SquadPlayer(id: 757807, name: 'Leo Aquino', number: 10, position: 'Midfielder', age: 28),
      SquadPlayer(id: 757808, name: 'William Barbio', number: 7, position: 'Attacker', age: 31),
      SquadPlayer(id: 757809, name: 'Tcharles', number: 9, position: 'Attacker', age: 30),
      SquadPlayer(id: 757810, name: 'Vitinho', number: 11, position: 'Attacker', age: 24),
    ],

    // 15383 - Amazonas Futebol Clube
    15383: [
      SquadPlayer(id: 1538301, name: 'Fabian Volpi', number: 1, position: 'Goalkeeper', age: 27),
      SquadPlayer(id: 1538302, name: 'Marcão', number: 12, position: 'Goalkeeper', age: 31),
      SquadPlayer(id: 1538303, name: 'Miranda', number: 3, position: 'Defender', age: 25),
      SquadPlayer(id: 1538304, name: 'Wellington Manzoli', number: 4, position: 'Defender', age: 28),
      SquadPlayer(id: 1538305, name: 'Fabiano', number: 6, position: 'Defender', age: 33),
      SquadPlayer(id: 1538306, name: 'Xavier', number: 5, position: 'Midfielder', age: 29),
      SquadPlayer(id: 1538307, name: 'Rafael Tavares', number: 10, position: 'Midfielder', age: 32),
      SquadPlayer(id: 1538308, name: 'Sassá', number: 9, position: 'Attacker', age: 31),
      SquadPlayer(id: 1538309, name: 'Dentinho', number: 7, position: 'Attacker', age: 27),
      SquadPlayer(id: 1538310, name: 'Matheus Serafim', number: 11, position: 'Attacker', age: 26),
    ],

    // 7566 - Manaus Futebol Clube
    7566: [
      SquadPlayer(id: 756601, name: 'Vinicius', number: 1, position: 'Goalkeeper', age: 29),
      SquadPlayer(id: 756602, name: 'Gutierrez', number: 3, position: 'Defender', age: 28),
      SquadPlayer(id: 756603, name: 'Jefferson', number: 4, position: 'Defender', age: 26),
      SquadPlayer(id: 756604, name: 'Dieyson', number: 6, position: 'Defender', age: 30),
      SquadPlayer(id: 756605, name: 'Felipe Tiririca', number: 8, position: 'Midfielder', age: 27),
      SquadPlayer(id: 756606, name: 'Gharib', number: 10, position: 'Midfielder', age: 28),
      SquadPlayer(id: 756607, name: 'Roney', number: 7, position: 'Attacker', age: 26),
      SquadPlayer(id: 756608, name: 'Denis', number: 9, position: 'Attacker', age: 27),
    ],

    // 18768 - Manauara Esporte Clube
    18768: [
      SquadPlayer(id: 1876801, name: 'Jonathan', number: 1, position: 'Goalkeeper', age: 28),
      SquadPlayer(id: 1876802, name: 'Paulinho', number: 2, position: 'Defender', age: 27),
      SquadPlayer(id: 1876803, name: 'Tibúrcio', number: 3, position: 'Defender', age: 29),
      SquadPlayer(id: 1876804, name: 'Jhonathan Moc', number: 6, position: 'Defender', age: 32),
      SquadPlayer(id: 1876805, name: 'Ítalo', number: 5, position: 'Midfielder', age: 26),
      SquadPlayer(id: 1876806, name: 'Wallace', number: 8, position: 'Midfielder', age: 28),
      SquadPlayer(id: 1876807, name: 'Neto Oliveira', number: 9, position: 'Attacker', age: 26),
      SquadPlayer(id: 1876808, name: 'Vitinho', number: 11, position: 'Attacker', age: 24),
    ],

    // 7579 - Princesa do Solimões Esporte Clube
    7579: [
      SquadPlayer(id: 757901, name: 'Jonathan', number: 1, position: 'Goalkeeper', age: 26),
      SquadPlayer(id: 757902, name: 'Rodolfo', number: 3, position: 'Defender', age: 29),
      SquadPlayer(id: 757903, name: 'Eric', number: 4, position: 'Defender', age: 27),
      SquadPlayer(id: 757904, name: 'Wesley', number: 2, position: 'Defender', age: 25),
      SquadPlayer(id: 757905, name: 'Koffi', number: 5, position: 'Midfielder', age: 28),
      SquadPlayer(id: 757906, name: 'Léo Pará', number: 8, position: 'Midfielder', age: 27),
      SquadPlayer(id: 757907, name: 'Jonas', number: 9, position: 'Attacker', age: 29),
      SquadPlayer(id: 757908, name: 'Max', number: 11, position: 'Attacker', age: 25),
    ],

    // 20120 - RPE Parintins
    20120: [
      SquadPlayer(id: 2012001, name: 'Robert', number: 1, position: 'Goalkeeper', age: 27),
      SquadPlayer(id: 2012002, name: 'Állefe', number: 2, position: 'Defender', age: 26),
      SquadPlayer(id: 2012003, name: 'Fernando', number: 3, position: 'Defender', age: 28),
      SquadPlayer(id: 2012004, name: 'Gabriel', number: 4, position: 'Defender', age: 25),
      SquadPlayer(id: 2012005, name: 'Victor Léo', number: 8, position: 'Midfielder', age: 26),
      SquadPlayer(id: 2012006, name: 'Darlyson', number: 10, position: 'Midfielder', age: 24),
      SquadPlayer(id: 2012007, name: 'Weverton', number: 9, position: 'Attacker', age: 28),
      SquadPlayer(id: 2012008, name: 'Lucas Silva', number: 11, position: 'Attacker', age: 25),
    ],

    // 243643 - Itacoatiara Futebol Clube
    243643: [
      SquadPlayer(id: 24364301, name: 'Zé Carlos', number: 1, position: 'Goalkeeper', age: 28),
      SquadPlayer(id: 24364302, name: 'Rayo', number: 3, position: 'Defender', age: 26),
      SquadPlayer(id: 24364303, name: 'Felipinho', number: 2, position: 'Defender', age: 25),
      SquadPlayer(id: 24364304, name: 'Marcelinho', number: 4, position: 'Defender', age: 27),
      SquadPlayer(id: 24364305, name: 'Léo Barba', number: 5, position: 'Midfielder', age: 29),
      SquadPlayer(id: 24364306, name: 'Thiago', number: 8, position: 'Midfielder', age: 26),
      SquadPlayer(id: 24364307, name: 'Léo Pará', number: 9, position: 'Attacker', age: 28),
      SquadPlayer(id: 24364308, name: 'Serginho', number: 11, position: 'Attacker', age: 24),
    ],

    // 7559 - Nacional Fast Clube
    7559: [
      SquadPlayer(id: 755901, name: 'Valter', number: 1, position: 'Goalkeeper', age: 28),
      SquadPlayer(id: 755902, name: 'Guigui', number: 2, position: 'Defender', age: 26),
      SquadPlayer(id: 755903, name: 'Thiago Spice', number: 3, position: 'Defender', age: 34),
      SquadPlayer(id: 755904, name: 'Bernardo', number: 4, position: 'Defender', age: 27),
      SquadPlayer(id: 755905, name: 'Emerson', number: 5, position: 'Midfielder', age: 29),
      SquadPlayer(id: 755906, name: 'Robinho', number: 10, position: 'Midfielder', age: 28),
      SquadPlayer(id: 755907, name: 'Claudinho', number: 7, position: 'Attacker', age: 26),
      SquadPlayer(id: 755908, name: 'Alex', number: 9, position: 'Attacker', age: 27),
    ],
  };
}
