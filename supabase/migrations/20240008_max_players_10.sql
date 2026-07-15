-- Raise the table cap from 8 to 10 players
alter table rooms alter column max_players set default 10;

-- Open lobbies created with the old default get the new cap
update rooms set max_players = 10 where max_players = 8 and status = 'lobby';
