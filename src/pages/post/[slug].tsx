import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import Prismic from '@prismicio/client';
import ptBR from 'date-fns/locale/pt-BR';
import Head from 'next/head';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useMemo } from 'react';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  const timeEstimated = useMemo(() => {
    if (router.isFallback) return 0;

    const totalWords = post.data.content.reduce((acc, current) => {
      const head = current.heading.split(/\s/g).length;
      const body = current.body.reduce((acc, current) => {
        const text = current.text.split(/\s/g).length;

        return acc + text;
      }, 0);

      return acc + head + body;
    }, 0)
    
    const readTime = Math.ceil(totalWords / 200);

    return readTime;
  }, [])

  if(router.isFallback) return ( <h2>Carregando...</h2> )

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling.</title>
      </Head>

      <Header />

      <img className={styles.banner} src={post.data.banner.url} alt={post.data.title}/>

      <main className={`${commonStyles.container} ${styles.header}`}>
        <h1>{post.data.title}</h1>

        <div>
          <span>
            <FiCalendar /> <small>{format(new Date(post.first_publication_date), "d MMM y", {locale: ptBR })}</small>

            <FiUser /> <small>{post.data.author}</small>
            
            <FiClock /> <small>{timeEstimated} min</small>
          </span>
        </div>

        {post.data.content.map((content, index) => (
          <article className={styles.content} key={index}>
            <h2>{content.heading}</h2>

            <div
              dangerouslySetInnerHTML={{__html: RichText.asHtml(content.body)}}
            />
          </article>
        ))}
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'poste')
  ]);

  const post = posts.results.map(post => {
    return {
      params: {
        slug: post.uid
      }
    }
  })


  return {
    paths: post,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('poste', String(slug), {});

  console.log(response.data);

  return {
    props: {
      post: response
    },
    revalidate: 60
  }
};
