export interface DecryptedMessage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  text: string;
  created_at: string;
  isMine: boolean;
  failed?: boolean;
}
