import { GetStaticProps } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';


import { getPrismicClient } from '../services/prismic';

import { FiCalendar, FiUser } from 'react-icons/fi';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleLoadMore() {
    const response = await fetch(nextPage)
      .then(res => res.json());
    
    setPosts([...posts, ...response.results]);
    setNextPage(response.next_page);
  }

  return(
    <>
      <Header />

      <main className={commonStyles.container}>
        <div className={styles.posts}>
          { posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
              
                <div>
                  <span>
                    <FiCalendar /> <small>{format(new Date(post.first_publication_date), "d MMM y", {locale: ptBR })}</small>

                    <FiUser /> <small>{post.data.author}</small>
                  </span>
                </div>
              </a>
            </Link>
          ))}

          {nextPage && (
            <button
            type="button"
            onClick={handleLoadMore}
            >
              Carregar mais posts
            </button>
          )}
          
        </div>

      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'poste')
  ], {
    pageSize: 2,
  });


  const postsPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results
  }

  return {
    props: {
      postsPagination,
    }
  }
};
