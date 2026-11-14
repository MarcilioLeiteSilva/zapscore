import '../models/squad_player.dart';

class TocantinenseSquads {
  static List<SquadPlayer> getSquad(int teamExternalId) {
    final players = _squads[teamExternalId];
    if (players != null && players.isNotEmpty) {
      return players;
    }
    return [];
  }

  static final Map<int, List<SquadPlayer>> _squads = {
    // 7810 - Tocantinópolis EC
    7810: [
      SquadPlayer(id: 781001, name: 'Johnathan', number: 1, position: 'Goalkeeper', age: 31),
      SquadPlayer(id: 781002, name: 'Anderson', number: 12, position: 'Goalkeeper', age: 26),
      SquadPlayer(id: 781003, name: 'Paulinho', number: 2, position: 'Defender', age: 29),
      SquadPlayer(id: 781004, name: 'Da Silva', number: 3, position: 'Defender', age: 27),
      SquadPlayer(id: 781005, name: 'Pedro Afonso', number: 4, position: 'Defender', age: 25),
      SquadPlayer(id: 781006, name: 'Robinho', number: 6, position: 'Defender', age: 28),
      SquadPlayer(id: 781007, name: 'Marcinho', number: 13, position: 'Defender', age: 24),
      SquadPlayer(id: 781008, name: 'Bideli', number: 5, position: 'Midfielder', age: 30),
      SquadPlayer(id: 781009, name: 'Gustavo Gomes', number: 8, position: 'Midfielder', age: 26),
      SquadPlayer(id: 781010, name: 'Gabriel Caju', number: 10, position: 'Midfielder', age: 27),
      SquadPlayer(id: 781011, name: 'Hiltinho', number: 15, position: 'Midfielder', age: 29),
      SquadPlayer(id: 781012, name: 'Daniel Cruz', number: 18, position: 'Midfielder', age: 23),
      SquadPlayer(id: 781013, name: 'William', number: 9, position: 'Attacker', age: 32),
      SquadPlayer(id: 781014, name: 'Bilau', number: 7, position: 'Attacker', age: 28),
      SquadPlayer(id: 781015, name: 'Joel', number: 11, position: 'Attacker', age: 26),
      SquadPlayer(id: 781016, name: 'Everson', number: 19, position: 'Attacker', age: 24),
    ],

    // 7807 - Capital FC
    7807: [
      SquadPlayer(id: 780701, name: 'Guilherme', number: 1, position: 'Goalkeeper', age: 28),
      SquadPlayer(id: 780702, name: 'Prezzi', number: 12, position: 'Goalkeeper', age: 25),
      SquadPlayer(id: 780703, name: 'Patryck Annes', number: 2, position: 'Defender', age: 27),
      SquadPlayer(id: 780704, name: 'Washington', number: 3, position: 'Defender', age: 30),
      SquadPlayer(id: 780705, name: 'Leozão', number: 4, position: 'Defender', age: 29),
      SquadPlayer(id: 780706, name: 'Giancarlo', number: 6, position: 'Defender', age: 26),
      SquadPlayer(id: 780707, name: 'Arthur', number: 5, position: 'Midfielder', age: 25),
      SquadPlayer(id: 780708, name: 'Romário', number: 8, position: 'Midfielder', age: 27),
      SquadPlayer(id: 780709, name: 'Zé Elias', number: 10, position: 'Midfielder', age: 28),
      SquadPlayer(id: 780710, name: 'Theo', number: 16, position: 'Midfielder', age: 22),
      SquadPlayer(id: 780711, name: 'Weslley', number: 9, position: 'Attacker', age: 27),
      SquadPlayer(id: 780712, name: 'Juninho', number: 11, position: 'Attacker', age: 24),
      SquadPlayer(id: 780713, name: 'Kariri', number: 7, position: 'Attacker', age: 29),
      SquadPlayer(id: 780714, name: 'Mailson', number: 17, position: 'Attacker', age: 26),
    ],

    // 7806 - Araguaína FR
    7806: [
      SquadPlayer(id: 780601, name: 'Mateus', number: 1, position: 'Goalkeeper', age: 27),
      SquadPlayer(id: 780602, name: 'Felipe', number: 12, position: 'Goalkeeper', age: 24),
      SquadPlayer(id: 780603, name: 'Renan', number: 2, position: 'Defender', age: 26),
      SquadPlayer(id: 780604, name: 'Dedé', number: 3, position: 'Defender', age: 31),
      SquadPlayer(id: 780605, name: 'Wanderson', number: 4, position: 'Defender', age: 28),
      SquadPlayer(id: 780606, name: 'Bruno', number: 6, position: 'Defender', age: 25),
      SquadPlayer(id: 780607, name: 'Paulo Roberto', number: 5, position: 'Midfielder', age: 29),
      SquadPlayer(id: 780608, name: 'Renatinho', number: 8, position: 'Midfielder', age: 27),
      SquadPlayer(id: 780609, name: 'Igor Pato', number: 10, position: 'Midfielder', age: 26),
      SquadPlayer(id: 780610, name: 'Juninho Araguaína', number: 15, position: 'Midfielder', age: 23),
      SquadPlayer(id: 780611, name: 'Maranhão', number: 9, position: 'Attacker', age: 30),
      SquadPlayer(id: 780612, name: 'Henrique', number: 11, position: 'Attacker', age: 25),
      SquadPlayer(id: 780613, name: 'Dieguinho', number: 7, position: 'Attacker', age: 28),
    ],

    // 16401 - União Atlético
    16401: [
      SquadPlayer(id: 1640101, name: 'Luiz Daniel', number: 1, position: 'Goalkeeper', age: 30),
      SquadPlayer(id: 1640102, name: 'Igor', number: 12, position: 'Goalkeeper', age: 23),
      SquadPlayer(id: 1640103, name: 'Jean', number: 2, position: 'Defender', age: 28),
      SquadPlayer(id: 1640104, name: 'Vitão', number: 3, position: 'Defender', age: 29),
      SquadPlayer(id: 1640105, name: 'Bruno Morais', number: 4, position: 'Defender', age: 27),
      SquadPlayer(id: 1640106, name: 'Rafael', number: 6, position: 'Defender', age: 26),
      SquadPlayer(id: 1640107, name: 'Alê', number: 5, position: 'Midfielder', age: 28),
      SquadPlayer(id: 1640108, name: 'Sandro', number: 8, position: 'Midfielder', age: 30),
      SquadPlayer(id: 1640109, name: 'Erick', number: 10, position: 'Midfielder', age: 25),
      SquadPlayer(id: 1640110, name: 'Frank', number: 16, position: 'Midfielder', age: 24),
      SquadPlayer(id: 1640111, name: 'Arnaldo', number: 9, position: 'Attacker', age: 29),
      SquadPlayer(id: 1640112, name: 'Luan', number: 11, position: 'Attacker', age: 26),
      SquadPlayer(id: 1640113, name: 'Gabriel Maranhão', number: 7, position: 'Attacker', age: 25),
    ],

    // 7809 - Gurupi EC
    7809: [
      SquadPlayer(id: 780901, name: 'Matheus Santos', number: 1, position: 'Goalkeeper', age: 28),
      SquadPlayer(id: 780902, name: 'Rafael', number: 12, position: 'Goalkeeper', age: 24),
      SquadPlayer(id: 780903, name: 'Gilberto', number: 2, position: 'Defender', age: 27),
      SquadPlayer(id: 780904, name: 'Vinicius', number: 3, position: 'Defender', age: 26),
      SquadPlayer(id: 780905, name: 'Daniel', number: 4, position: 'Defender', age: 29),
      SquadPlayer(id: 780906, name: 'Caio', number: 6, position: 'Defender', age: 25),
      SquadPlayer(id: 780907, name: 'João Pedro', number: 5, position: 'Midfielder', age: 24),
      SquadPlayer(id: 780908, name: 'Felipe Silva', number: 8, position: 'Midfielder', age: 27),
      SquadPlayer(id: 780909, name: 'Wellington', number: 10, position: 'Midfielder', age: 28),
      SquadPlayer(id: 780910, name: 'Lucas', number: 14, position: 'Midfielder', age: 23),
      SquadPlayer(id: 780911, name: 'Bruno Recife', number: 9, position: 'Attacker', age: 31),
      SquadPlayer(id: 780912, name: 'Tozim', number: 11, position: 'Attacker', age: 33),
      SquadPlayer(id: 780913, name: 'Romário', number: 7, position: 'Attacker', age: 26),
    ],

    // 7808 - Guaraí
    7808: [
      SquadPlayer(id: 780801, name: 'Dida', number: 1, position: 'Goalkeeper', age: 29),
      SquadPlayer(id: 780802, name: 'Marcelo', number: 12, position: 'Goalkeeper', age: 23),
      SquadPlayer(id: 780803, name: 'Alan', number: 2, position: 'Defender', age: 26),
      SquadPlayer(id: 780804, name: 'Rodrigo', number: 3, position: 'Defender', age: 28),
      SquadPlayer(id: 780805, name: 'Tiago', number: 4, position: 'Defender', age: 27),
      SquadPlayer(id: 780806, name: 'Cleiton', number: 6, position: 'Defender', age: 25),
      SquadPlayer(id: 780807, name: 'Paulinho', number: 5, position: 'Midfielder', age: 28),
      SquadPlayer(id: 780808, name: 'Gean', number: 8, position: 'Midfielder', age: 26),
      SquadPlayer(id: 780809, name: 'Marquinhos', number: 10, position: 'Midfielder', age: 27),
      SquadPlayer(id: 780810, name: 'Denis', number: 15, position: 'Midfielder', age: 24),
      SquadPlayer(id: 780811, name: 'Pedro Júnior', number: 9, position: 'Attacker', age: 30),
      SquadPlayer(id: 780812, name: 'Tallyson', number: 11, position: 'Attacker', age: 25),
      SquadPlayer(id: 780813, name: 'Dudu', number: 7, position: 'Attacker', age: 24),
    ],

    // 19139 - Bela Vista
    19139: [
      SquadPlayer(id: 1913901, name: 'André', number: 1, position: 'Goalkeeper', age: 28),
      SquadPlayer(id: 1913902, name: 'Danilo', number: 12, position: 'Goalkeeper', age: 25),
      SquadPlayer(id: 1913903, name: 'Lucas Bahia', number: 2, position: 'Defender', age: 27),
      SquadPlayer(id: 1913904, name: 'Jefferson', number: 3, position: 'Defender', age: 29),
      SquadPlayer(id: 1913905, name: 'Emerson', number: 4, position: 'Defender', age: 28),
      SquadPlayer(id: 1913906, name: 'Renan', number: 6, position: 'Defender', age: 26),
      SquadPlayer(id: 1913907, name: 'Alexandre', number: 5, position: 'Midfielder', age: 26),
      SquadPlayer(id: 1913908, name: 'Michel', number: 8, position: 'Midfielder', age: 28),
      SquadPlayer(id: 1913909, name: 'Edinho', number: 10, position: 'Midfielder', age: 30),
      SquadPlayer(id: 1913910, name: 'Fabinho', number: 16, position: 'Midfielder', age: 25),
      SquadPlayer(id: 1913911, name: 'Vitinho', number: 9, position: 'Attacker', age: 25),
      SquadPlayer(id: 1913912, name: 'Douglas', number: 11, position: 'Attacker', age: 27),
      SquadPlayer(id: 1913913, name: 'Riquelme', number: 7, position: 'Attacker', age: 23),
    ],

    // 21977 - Batalhão FC
    21977: [
      SquadPlayer(id: 2197701, name: 'Victor Hugo', number: 1, position: 'Goalkeeper', age: 26),
      SquadPlayer(id: 2197702, name: 'Gabriel', number: 12, position: 'Goalkeeper', age: 22),
      SquadPlayer(id: 2197703, name: 'Samuel', number: 2, position: 'Defender', age: 25),
      SquadPlayer(id: 2197704, name: 'Arthur', number: 3, position: 'Defender', age: 27),
      SquadPlayer(id: 2197705, name: 'Douglas Silva', number: 4, position: 'Defender', age: 28),
      SquadPlayer(id: 2197706, name: 'Kaique', number: 6, position: 'Defender', age: 24),
      SquadPlayer(id: 2197707, name: 'Luiz Henrique', number: 5, position: 'Midfielder', age: 26),
      SquadPlayer(id: 2197708, name: 'Carlos Alberto', number: 8, position: 'Midfielder', age: 28),
      SquadPlayer(id: 2197709, name: 'Yuri', number: 10, position: 'Midfielder', age: 25),
      SquadPlayer(id: 2197710, name: 'Nathan', number: 14, position: 'Midfielder', age: 23),
      SquadPlayer(id: 2197711, name: 'Murilo', number: 9, position: 'Attacker', age: 26),
      SquadPlayer(id: 2197712, name: 'Kauê', number: 11, position: 'Attacker', age: 24),
      SquadPlayer(id: 2197713, name: 'Ryan', number: 7, position: 'Attacker', age: 22),
    ],
  };
}

