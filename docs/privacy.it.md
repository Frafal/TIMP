# Informativa sulla privacy

Versione del 26 novembre 2026. [In English](privacy.md).

## Chi è responsabile

Francesco Falqui, persona fisica, è il titolare del trattamento dei dati personali del
servizio di TIMP (account, sincronizzazione, condivisione, pubblicazione, chat collegate).
Per qualsiasi cosa sui tuoi dati scrivi a **privacy@usetimp.com**.

In breve: senza account i tuoi viaggi restano sul telefono. Un account chiede solo un nome
che scegli tu e una passkey: niente email, niente password. Niente pubblicità, niente
tracciamento, niente venduto. I tuoi viaggi sono cifrati dove sono conservati, nell'Unione
europea.

## L'app, con o senza account

- I viaggi stanno nella memoria del browser sul telefono. L'app non ha cookie, statistiche
  o script di terzi all'avvio; sul telefono tiene solo ciò che le serve per funzionare. Il
  codice della mappa di Google si carica solo se scegli Google Maps, alle condizioni di
  Google.
- Il telefono chiede ad altri servizi solo ciò che serve a una funzione, e loro vedono il
  tuo indirizzo IP: i riquadri della mappa (OpenFreeMap, OpenStreetMap o Google) per la zona
  che guardi; il nome e l'indirizzo di una tappa per trovarne la posizione (Google con una
  chiave, altrimenti OpenStreetMap); un link breve di Google Maps al risolutore di link di
  TIMP, che non conserva nulla; il mese di un cambio a Frankfurter, mai un importo o un
  luogo.
- Il meteo si chiede al servizio di TIMP con un luogo arrotondato a circa 10 km; il servizio
  lo chiede a MET Norway con al massimo un chilometro di precisione e non conserva nulla di
  chi l'ha chiesto.
- I file dell'app li serve Cloudflare su usetimp.com, che vede il tuo indirizzo IP quando li
  carica (fino al 26 dicembre 2026 anche GitHub Pages, al vecchio indirizzo dell'app).
- Un file viaggio che salvi va solo dove lo mandi; le spese private ci finiscono solo se lo
  dici tu.

## Con un account: cosa si conserva, perché, per quanto

| Cosa | Perché | Base giuridica | Per quanto |
|---|---|---|---|
| Il tuo nome (handle), le chiavi pubbliche delle tue passkey, il nome che ogni browser dà a sé stesso | Il tuo account, l'accesso, distinguere i tuoi dispositivi | Contratto (GDPR art. 6.1.b) | Finché non cancelli l'account |
| Sessioni e codici di recupero, come hash | Tenerti connesso, farti rientrare | Contratto | Sessioni 180 giorni o finché esci; codici finché li usi o li rifai |
| I tuoi viaggi, le loro versioni e le tue spese private, cifrati | I tuoi viaggi su ogni telefono, condivisi con chi scegli | Contratto | Finché non li cancelli tu, o l'account |
| Con chi è condiviso un viaggio, gli inviti, cosa mostri al gruppo | La condivisione | Contratto | Inviti 14 giorni; il resto finché lo togli |
| Un viaggio che pubblichi | La pagina che hai scelto di pubblicare | Contratto | Finché non la ritiri |
| Un telefono aggiunto con un codice: il nome che si danno il browser che chiede e quello che approva, il codice e un segreto come hash | Aggiungere un telefono al tuo account, e avvisarne gli altri telefoni | Contratto | 10 minuti mentre aspetta; dopo l'uso, 14 giorni |
| Le chat che colleghi (quale app, cosa può fare, quando è stata usata) e le loro chiavi, come hash | Far lavorare la tua AI sui tuoi viaggi | Contratto | Finché non la scolleghi; chiavi 1 ora, rinnovabili per 60 giorni |
| L'invito con cui ti sei registrato | Gli account sono su invito | Legittimo interesse (art. 6.1.f) | Finché non cancelli l'account |
| Un registro di sicurezza: accessi, uscite, chat collegate, viaggi cancellati… con un numero interno, mai il contenuto dei viaggi, indirizzi o IP | La sicurezza, prevenire abusi | Legittimo interesse | 180 giorni |
| La versione dei termini d'uso e di questa informativa che hai accettato, e quando | La prova dell'accettazione | Legittimo interesse | Finché non cancelli l'account |

Il servizio non registra le richieste. Gli indirizzi di rete si usano per un minuto, per
limitare gli abusi, e non si conservano. Le modifiche che hai fatto a un viaggio che un
altro ti ha condiviso restano nel suo viaggio quando te ne vai, non più legate a te.

## Chi aiuta, e dove

- **Cloudflare** fa funzionare il servizio e il suo database. Il database è nell'Unione
  europea e ci resta; la rete di Cloudflare può portare le richieste anche fuori, secondo il
  suo accordo sul trattamento dei dati e le clausole contrattuali tipo dell'UE.
- **Cloudflare** serve anche i file dell'app; **GitHub** li ha serviti al vecchio indirizzo
  fino al 26 dicembre 2026. **MET Norway** riceve un luogo arrotondato per il meteo.
  I servizi di mappa, ricerca e cambi li interroga il tuo telefono, come sopra.
- **La tua chat AI**: quando colleghi Claude, ChatGPT o un'altra chat, ciò che legge dei tuoi
  viaggi va a quella società, alle sue condizioni. Scegli tu quale, e la scolleghi in Tu →
  La tua AI quando vuoi.

## I tuoi diritti

- Vedere e prendere tutto ciò che il servizio conserva di te: Tu → Esporta i miei dati.
- Cancellare tutto: Tu → Elimina account, subito. Le copie di sicurezza tengono la storia
  del database fino a 30 giorni, poi sparisce anche da lì.
- Correggere, limitare o opporti: cambia i tuoi viaggi nell'app, o scrivi a
  privacy@usetimp.com.
- Fare reclamo al Garante per la protezione dei dati personali (garanteprivacy.it), o
  all'autorità del paese in cui vivi.

## Età, e modifiche

Un account è per chi ha almeno 16 anni. Quando questa informativa cambia, l'app te lo dice
e ti chiede di leggerla prima di andare avanti.
