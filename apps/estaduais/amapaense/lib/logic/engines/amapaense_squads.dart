import '../models/squad_player.dart';

class AmapaenseSquads {
  static List<SquadPlayer> getSquad(int teamExternalId) {
    final players = _squads[teamExternalId];
    if (players != null && players.isNotEmpty) {
      return players;
    }
    return [];
  }

  static final Map<int, List<SquadPlayer>> _squads = {
    // 2224 - Trem Desportivo Clube
    2224: [
      SquadPlayer(id: 222401, name: 'Vitor Hugo', number: 1, position: 'Goalkeeper', age: 31, photo: 'https://cdn-img.staticzz.com/img/jogadores/31/349831_med__20260301120000.png'),
      SquadPlayer(id: 222402, name: 'Redson', number: 12, position: 'Goalkeeper', age: 26),
      SquadPlayer(id: 222403, name: 'Felipe Macapá', number: 3, position: 'Defender', age: 28),
      SquadPlayer(id: 222404, name: 'Daniel Silva', number: 4, position: 'Defender', age: 26),
      SquadPlayer(id: 222405, name: 'Igor', number: 2, position: 'Defender', age: 25),
      SquadPlayer(id: 222406, name: 'Alexandre', number: 6, position: 'Defender', age: 27),
      SquadPlayer(id: 222407, name: 'Rubens Lucas', number: 8, position: 'Midfielder', age: 27),
      SquadPlayer(id: 222408, name: 'Silvio', number: 10, position: 'Midfielder', age: 29),
      SquadPlayer(id: 222409, name: 'Levi', number: 5, position: 'Midfielder', age: 28),
      SquadPlayer(id: 222410, name: 'Eduardo', number: 15, position: 'Midfielder', age: 24),
      SquadPlayer(id: 222411, name: 'Aleilson', number: 9, position: 'Attacker', age: 38, photo: 'https://cdn-img.staticzz.com/img/jogadores/45/14545_med__20260215100000.png'),
      SquadPlayer(id: 222412, name: 'Kesley', number: 7, position: 'Attacker', age: 25),
      SquadPlayer(id: 222413, name: 'Dudu', number: 11, position: 'Attacker', age: 23),
      SquadPlayer(id: 222414, name: 'Neto', number: 17, position: 'Attacker', age: 26),
    ],

    // 7785 - Santos Futebol Clube do Amapá
    7785: [
      SquadPlayer(id: 778501, name: 'Matheus Carioca', number: 1, position: 'Goalkeeper', age: 27),
      SquadPlayer(id: 778502, name: 'Paulo', number: 12, position: 'Goalkeeper', age: 24),
      SquadPlayer(id: 778503, name: 'Batata', number: 2, position: 'Defender', age: 29),
      SquadPlayer(id: 778504, name: 'Preto', number: 3, position: 'Defender', age: 30),
      SquadPlayer(id: 778505, name: 'Guilherme', number: 4, position: 'Defender', age: 25),
      SquadPlayer(id: 778506, name: 'Lucas Santana', number: 6, position: 'Defender', age: 26),
      SquadPlayer(id: 778507, name: 'Dudu', number: 7, position: 'Midfielder', age: 24),
      SquadPlayer(id: 778508, name: 'Bruninho', number: 8, position: 'Midfielder', age: 28),
      SquadPlayer(id: 778509, name: 'Fabinho', number: 10, position: 'Midfielder', age: 27),
      SquadPlayer(id: 778510, name: 'Luciano', number: 11, position: 'Attacker', age: 26),
      SquadPlayer(id: 778511, name: 'Rômulo', number: 9, position: 'Attacker', age: 29),
      SquadPlayer(id: 778512, name: 'Aldair', number: 18, position: 'Attacker', age: 25),
    ],

    // 10858 - Oratório Recreativo Clube
    10858: [
      SquadPlayer(id: 1085801, name: 'Lucas Bento', number: 1, position: 'Goalkeeper', age: 25),
      SquadPlayer(id: 1085802, name: 'Pato', number: 12, position: 'Goalkeeper', age: 23),
      SquadPlayer(id: 1085803, name: 'Dedé', number: 3, position: 'Defender', age: 29),
      SquadPlayer(id: 1085804, name: 'Marlon', number: 4, position: 'Defender', age: 26),
      SquadPlayer(id: 1085805, name: 'Davy', number: 2, position: 'Defender', age: 24),
      SquadPlayer(id: 1085806, name: 'Tarta', number: 10, position: 'Midfielder', age: 30),
      SquadPlayer(id: 1085807, name: 'Renatinho', number: 8, position: 'Midfielder', age: 26),
      SquadPlayer(id: 1085808, name: 'Gabriel', number: 5, position: 'Midfielder', age: 25),
      SquadPlayer(id: 1085809, name: 'Abuda', number: 9, position: 'Attacker', age: 28),
      SquadPlayer(id: 1085810, name: 'Vinícius', number: 7, position: 'Attacker', age: 24),
      SquadPlayer(id: 1085811, name: 'Luan', number: 11, position: 'Attacker', age: 22),
    ],

    // 10861 - Independente Esporte Clube
    10861: [
      SquadPlayer(id: 1086101, name: 'Wanderson', number: 1, position: 'Goalkeeper', age: 26),
      SquadPlayer(id: 1086102, name: 'Thiago', number: 12, position: 'Goalkeeper', age: 23),
      SquadPlayer(id: 1086103, name: 'Kaio', number: 5, position: 'Defender', age: 24),
      SquadPlayer(id: 1086104, name: 'Marcão', number: 3, position: 'Defender', age: 28),
      SquadPlayer(id: 1086105, name: 'Yuri', number: 4, position: 'Defender', age: 25),
      SquadPlayer(id: 1086106, name: 'Breno', number: 8, position: 'Midfielder', age: 27),
      SquadPlayer(id: 1086107, name: 'Patrick', number: 10, position: 'Midfielder', age: 26),
      SquadPlayer(id: 1086108, name: 'Marquinhos', number: 7, position: 'Attacker', age: 25),
      SquadPlayer(id: 1086109, name: 'Rafael', number: 9, position: 'Attacker', age: 28),
      SquadPlayer(id: 1086110, name: 'Matheus', number: 11, position: 'Attacker', age: 22),
    ],

    // 7848 - Ypiranga Clube
    7848: [
      SquadPlayer(id: 784801, name: 'Rafael', number: 12, position: 'Goalkeeper', age: 26),
      SquadPlayer(id: 784802, name: 'Marcos', number: 1, position: 'Goalkeeper', age: 24),
      SquadPlayer(id: 784803, name: 'Guilherme', number: 4, position: 'Defender', age: 23),
      SquadPlayer(id: 784804, name: 'Robson', number: 3, position: 'Defender', age: 29),
      SquadPlayer(id: 784805, name: 'Pedrão', number: 2, position: 'Defender', age: 27),
      SquadPlayer(id: 784806, name: 'Caio', number: 8, position: 'Midfielder', age: 25),
      SquadPlayer(id: 784807, name: 'Juninho', number: 10, position: 'Midfielder', age: 27),
      SquadPlayer(id: 784808, name: 'Tony Love', number: 9, position: 'Attacker', age: 32),
      SquadPlayer(id: 784809, name: 'Danilinho', number: 7, position: 'Attacker', age: 26),
      SquadPlayer(id: 784810, name: 'Felipe', number: 11, position: 'Attacker', age: 23),
    ],

    // 270734 - Portuguesa de Desporto do Amapá
    270734: [
      SquadPlayer(id: 27073401, name: 'Diego', number: 1, position: 'Goalkeeper', age: 24),
      SquadPlayer(id: 27073402, name: 'Arthur', number: 12, position: 'Goalkeeper', age: 22),
      SquadPlayer(id: 27073403, name: 'Willian', number: 3, position: 'Defender', age: 27),
      SquadPlayer(id: 27073404, name: 'Renato', number: 4, position: 'Defender', age: 26),
      SquadPlayer(id: 27073405, name: 'Paulinho', number: 8, position: 'Midfielder', age: 25),
      SquadPlayer(id: 27073406, name: 'Gustavo', number: 10, position: 'Midfielder', age: 26),
      SquadPlayer(id: 27073407, name: 'Luan', number: 11, position: 'Attacker', age: 22),
      SquadPlayer(id: 27073408, name: 'Fabrício', number: 9, position: 'Attacker', age: 28),
      SquadPlayer(id: 27073409, name: 'Igor Santos', number: 7, position: 'Attacker', age: 24),
    ],

    // 78216 - Rio Norte Futebol Clube
    78216: [
      SquadPlayer(id: 7821601, name: 'Gabriel', number: 1, position: 'Goalkeeper', age: 23),
      SquadPlayer(id: 7821602, name: 'Lucas', number: 12, position: 'Goalkeeper', age: 21),
      SquadPlayer(id: 7821603, name: 'Everton', number: 3, position: 'Defender', age: 27),
      SquadPlayer(id: 7821604, name: 'Rodolfo', number: 4, position: 'Defender', age: 25),
      SquadPlayer(id: 7821605, name: 'Alan', number: 2, position: 'Defender', age: 24),
      SquadPlayer(id: 7821606, name: 'Marcio', number: 8, position: 'Midfielder', age: 26),
      SquadPlayer(id: 7821607, name: 'Wendel', number: 10, position: 'Midfielder', age: 25),
      SquadPlayer(id: 7821608, name: 'Ronaldo', number: 9, position: 'Attacker', age: 26),
      SquadPlayer(id: 7821609, name: 'Tiago', number: 7, position: 'Attacker', age: 23),
      SquadPlayer(id: 7821610, name: 'Cléber', number: 11, position: 'Attacker', age: 24),
    ],

    // 15622 - SER São José
    15622: [
      SquadPlayer(id: 1562201, name: 'Bruno', number: 1, position: 'Goalkeeper', age: 28),
      SquadPlayer(id: 1562202, name: 'Samuel', number: 12, position: 'Goalkeeper', age: 24),
      SquadPlayer(id: 1562203, name: 'Emerson', number: 3, position: 'Defender', age: 29),
      SquadPlayer(id: 1562204, name: 'Wallace', number: 4, position: 'Defender', age: 26),
      SquadPlayer(id: 1562205, name: 'Leandro', number: 2, position: 'Defender', age: 27),
      SquadPlayer(id: 1562206, name: 'Rodrigo', number: 10, position: 'Midfielder', age: 29),
      SquadPlayer(id: 1562207, name: 'Danilo', number: 8, position: 'Midfielder', age: 26),
      SquadPlayer(id: 1562208, name: 'Jean', number: 9, position: 'Attacker', age: 27),
      SquadPlayer(id: 1562209, name: 'Wesley', number: 7, position: 'Attacker', age: 25),
      SquadPlayer(id: 1562210, name: 'Marcelinho', number: 11, position: 'Attacker', age: 23),
    ],
  };
}
