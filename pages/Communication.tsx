import React, { useState } from 'react';
import { MOCK_MESSAGES, MOCK_USERS } from '../constants';
import { Send, User as UserIcon } from 'lucide-react';
import { Message } from '../types';

export const Communication: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      authorId: 'u-1', // Current user (Therapist)
      content: newMessage,
      timestamp: Date.now(),
      type: 'GENERAL',
      readBy: ['u-1']
    };
    setMessages([...messages, msg]);
    setNewMessage('');
  };

  const getUser = (id: string) => MOCK_USERS.find(u => u.id === id);

  return (
    <div className="h-[calc(100vh-160px)] md:h-[calc(100vh-120px)] flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-20 md:mb-0">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-800">Diário de Comunicação</h2>
        <p className="text-sm text-gray-500">Espaço compartilhado para Pais, Terapeutas e Especialistas.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gray-50/50">
        {messages.map((msg) => {
          const author = getUser(msg.authorId);
          const isMe = msg.authorId === 'u-1';
          
          return (
            <div key={msg.id} className={`flex gap-3 md:gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
               <div className="flex-shrink-0">
                  {author?.avatarUrl ? (
                    <img src={author.avatarUrl} alt={author.name} className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-200" />
                  ) : (
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
                    </div>
                  )}
               </div>
               <div className={`max-w-[85%] md:max-w-[60%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs md:text-sm font-bold text-gray-900">{author?.name}</span>
                      <span className="text-[10px] md:text-xs text-gray-400 bg-white px-1.5 rounded border border-gray-200 uppercase">
                          {author?.role === 'THERAPIST' ? 'Terapeuta' : author?.role === 'PARENT' ? 'Responsável' : 'Especialista'}
                      </span>
                  </div>
                  <div className={`p-3 md:p-4 rounded-2xl shadow-sm text-sm ${
                      isMe 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : msg.type === 'ALERT' 
                        ? 'bg-red-50 text-red-900 border border-red-100 rounded-tl-none'
                        : 'bg-white text-gray-700 border border-gray-200 rounded-tl-none'
                  }`}>
                      {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1">
                      {new Date(msg.timestamp).toLocaleString()}
                  </span>
               </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
          <input 
            type="text" 
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 outline-none"
            placeholder="Digite sua mensagem para a equipe..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};