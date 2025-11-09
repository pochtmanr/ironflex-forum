'use client'

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Footer: React.FC = () => {

  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <a 
                href="https://www.tarnovsky.ru.kz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <img 
                  src="/images/4_logo12.svg" 
                  alt="tarnovsky.ru" 
                  className="h-12 w-auto"
                />
                
              </a>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Форум для любителей бодибилдинга, фитнеса и здорового образа жизни. 
              Делитесь опытом, задавайте вопросы и находите единомышленников.
            </p>
          </div>


          {/* Information Links */}
          <div className="md:col-span-1">
            <h4 className="text-lg font-semibold mb-4">Информация</h4>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <a href="mailto:info@tarnovsky.ru.kz" className="text-gray-400 hover:text-white transition-colors text-sm">
                Контакты
              </a>
              <span className="text-gray-400 text-sm">•</span>
              <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors text-sm">
                Политика конфиденциальности
              </Link>
              <span className="text-gray-400 text-sm">•</span>
              <Link href="/terms-of-service" className="text-gray-400 hover:text-white transition-colors text-sm">
                Условия использования
              </Link>
              <span className="text-gray-400 text-sm">•</span>
              <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm">
                О нас
              </Link>
              <span className="text-gray-400 text-sm">•</span>
              <Link href="/faq" className="text-gray-400 hover:text-white transition-colors text-sm">
                FAQ
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 pt-6">
        </div>
      </div>
    </footer>
  );
};

export default Footer;
